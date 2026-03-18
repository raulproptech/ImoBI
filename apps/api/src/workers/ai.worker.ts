import Anthropic from '@anthropic-ai/sdk'
import { db, conversations, messages, contacts } from '@imobi/db'
import { eq, desc } from 'drizzle-orm'
import type { AIChatResponse } from '@imobi/shared'

const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY']!,
})

export async function processAIResponse(conversationId: string) {
  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
    with: {
      contact: true,
      instance: true,
      messages: {
        orderBy: [desc(messages.createdAt)],
        limit: 20,
      },
    },
  })

  if (!conversation || !conversation.botActive) return

  const contact = conversation.contact

  // Build system prompt
  const systemPrompt = buildSystemPrompt(conversation)

  // Build message history for Claude
  const messageHistory = conversation.messages
    .reverse()
    .slice(-15) // Last 15 messages for context
    .map(msg => ({
      role: msg.direction === 'inbound' ? 'user' as const : 'assistant' as const,
      content: msg.content ?? `[${msg.type}]`,
    }))

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messageHistory,
      tools: [
        {
          name: 'crm_action',
          description: 'Perform CRM actions like updating lead stage, score, or extracting lead data',
          input_schema: {
            type: 'object' as const,
            properties: {
              actions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    payload: { type: 'object' },
                  },
                },
              },
              should_handoff: { type: 'boolean' },
              handoff_reason: { type: 'string' },
              intent: { type: 'string' },
              lead_data: { type: 'object' },
            },
            required: ['actions', 'should_handoff', 'intent'],
          },
        },
      ],
    })

    // Extract text response
    const textContent = response.content.find(c => c.type === 'text')
    const aiMessage = textContent?.text ?? ''

    // Extract tool use (CRM actions)
    const toolUse = response.content.find(c => c.type === 'tool_use')
    let aiActions: AIChatResponse = {
      message: aiMessage,
      intent: 'other',
      actions: [],
      shouldHandoff: false,
      leadDataExtracted: {},
      confidence: 0.8,
    }

    if (toolUse && toolUse.type === 'tool_use') {
      const input = toolUse.input as any
      aiActions = {
        message: aiMessage,
        intent: input.intent ?? 'other',
        actions: input.actions ?? [],
        shouldHandoff: input.should_handoff ?? false,
        handoffReason: input.handoff_reason,
        leadDataExtracted: input.lead_data ?? {},
        confidence: 0.85,
      }
    }

    // Save AI response as message
    await db.insert(messages).values({
      tenantId: conversation.tenantId,
      conversationId,
      direction: 'outbound',
      type: 'text',
      content: aiMessage,
      aiGenerated: true,
      aiModel: 'claude-sonnet-4-5',
      aiInputTokens: response.usage.input_tokens,
      aiOutputTokens: response.usage.output_tokens,
      status: 'pending',
    })

    // Handle handoff
    if (aiActions.shouldHandoff) {
      await db.update(conversations)
        .set({
          status: 'waiting_agent',
          botActive: false,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId))
    }

    // Apply CRM actions
    if (contact && aiActions.leadDataExtracted) {
      const updates: Record<string, unknown> = {}
      const ld = aiActions.leadDataExtracted

      if (ld.fullName && !contact.fullName) updates['fullName'] = ld.fullName
      if (ld.email && !contact.email) updates['email'] = ld.email
      if (ld.transactionType) {
        updates['interestProfile'] = {
          ...(contact.interestProfile as object ?? {}),
          transactionType: ld.transactionType,
          ...(ld.neighborhoods ? { neighborhoods: [ld.neighborhoods] } : {}),
          ...(ld.minPrice ? { minPrice: ld.minPrice } : {}),
          ...(ld.maxPrice ? { maxPrice: ld.maxPrice } : {}),
        }
      }

      if (Object.keys(updates).length > 0) {
        await db.update(contacts)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(contacts.id, contact.id))
      }
    }

    // Queue outbound WhatsApp message
    // (Redis queue - picked up by WA sender worker)

    return aiActions

  } catch (error) {
    console.error('AI processing error:', error)
    // On AI error, handoff to human
    await db.update(conversations)
      .set({ status: 'waiting_agent', botActive: false, updatedAt: new Date() })
      .where(eq(conversations.id, conversationId))
  }
}

function buildSystemPrompt(conversation: any): string {
  const instance = conversation.instance
  const contact = conversation.contact

  return `Você é ${instance?.botName ?? 'Assistente'}, assistente virtual de uma imobiliária brasileira.

IDENTIDADE:
- Seja profissional, prestativo e amigável
- Responda sempre em português brasileiro
- Seja conciso mas completo nas respostas

CONTATO ATUAL:
- Nome: ${contact?.fullName ?? 'Não identificado'}
- Telefone: ${conversation.waContactPhone}
- Score: ${contact?.leadScore ?? 'N/A'}/100
- Perfil de interesse: ${contact?.interestProfile ? JSON.stringify(contact.interestProfile) : 'Não informado'}

INSTRUÇÕES:
1. Qualifique o lead fazendo perguntas naturais sobre o que procuram
2. Capture: tipo de imóvel, bairro/cidade, faixa de preço, prazo de compra/aluguel
3. Ofereça imóveis disponíveis quando tiver o perfil
4. Se o cliente quiser falar com um corretor, acionar handoff
5. NUNCA invente preços ou endereços de imóveis
6. Respeite a LGPD - não compartilhe dados de terceiros

REGRAS DE HANDOFF:
- Cliente pede para falar com humano
- Negociação de preço iniciada
- Cliente quer agendar visita
- Reclamação ou situação delicada

Use a ferramenta crm_action para registrar dados coletados e intenções identificadas.`
}
