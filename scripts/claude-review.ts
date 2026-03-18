#!/usr/bin/env node

import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'

config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface ReviewResult {
  bugs: string[]
  refactors: string[]
  bestPractices: string[]
  tsIssues: string[]
  performance: string[]
  security: string[]
  patches: string
}

async function claudeReview(filePath: string) {
  try {
    const code = await readFile(filePath, 'utf-8')
    const filename = path.basename(filePath)

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `
Revise este arquivo ${filename} do projeto ImoBI (Next.js/Fastify/Drizzle/Turborepo TypeScript):

\`\`\`typescript
${code}
\`\`\`

Responda JSON válido ReviewResult:
{
  "bugs": ["lista bugs encontrados"],
  "refactors": ["melhorias refatoração"],
  "bestPractices": ["best practices Next/Fastify/TS"],
  "tsIssues": ["erros TS strict"],
  "performance": ["otimizações performance"],
  "security": ["vulnerabilidades segurança"],
  "patches": "código patches principais"
}

Seja conciso técnico dev senior.
        `,
      }],
    })

const textContent = response.content.find(c => c.type === 'text')?.text
if (!textContent) throw new Error('No text response from Claude')
const review = JSON.parse(textContent) as ReviewResult

    console.log('\n🤖 CLAUDE-REVIEW RELATÓRIO:\n')
    console.log('🐛 Bugs:', review.bugs.join('\n  - ') || 'Nenhum')
    console.log('\n🔧 Refators:', review.refactors.join('\n  - ') || 'Nenhum')
    console.log('\n⭐ Best Practices:', review.bestPractices.join('\n  - ') || 'Nenhum')
    console.log('\n⚠️ TS Issues:', review.tsIssues.join('\n  - ') || 'Nenhum')
    console.log('\n⚡ Performance:', review.performance.join('\n  - ') || 'Nenhum')
    console.log('\n🔒 Security:', review.security.join('\n  - ') || 'Nenhum')
    console.log('\n📄 PATCHES:\n' + review.patches)

    return review
  } catch (error) {
    console.error('❌ Erro Claude review:', error)
    process.exit(1)
  }
}

const [,, filePath] = process.argv
if (!filePath) {
  console.log('Uso: npx claude-review [arquivo/dir]')
  console.log('Ex: npx claude-review apps/web/src/app/(app)/crm/page.tsx')
  process.exit(1)
}

claudeReview(filePath)

