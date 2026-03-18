import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://postgres@localhost:5432/imobi_platform?schema=public',
  },
  verbose: true,
  strict: true,
})

