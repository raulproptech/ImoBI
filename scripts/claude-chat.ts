#!/usr/bin/env node

import { createInterface } from 'readline'
import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'

config()

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Você > '
})

console.log('🤖 Claude Chat Terminal - Imobi Platform\nDigite "exit" para sair.\n')

async function chat(message: string) {
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 2000,
    temperature: 0.7,
    system: 'Você é Claude, assistente expert em TypeScript, Next.js, Fastify, Drizzle. Ajude com o projeto Imobi CRM Imobiliário.',
    messages: [{ role: 'user', content: message }],
  })

  const text = response.content.find(c => c.type === 'text')?.text || 'Erro resposta'
  console.log('\\n🤖 Claude:', text)
}

rl.prompt()
rl.on('line', async (line) => {
  const message = line.trim()
  if (message.toLowerCase() === 'exit') {
    rl.close()
    return
  }
  await chat(message)
  rl.prompt()
}).on('close', () => {
  console.log('\\n👋 Tchau!')
  process.exit(0)
})
