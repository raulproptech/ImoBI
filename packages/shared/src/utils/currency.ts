/**
 * Format a value in cents to BRL currency string
 * @param cents - value in cents (e.g., 10000 = R$ 100,00)
 */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

/**
 * Parse a BRL formatted string to cents
 */
export function parseBRL(value: string): number {
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.')
  const float = parseFloat(cleaned)
  return Math.round(float * 100)
}

/**
 * Format cents to compact BRL (e.g., R$ 1,5M, R$ 500k)
 */
export function formatBRLCompact(cents: number): string {
  const value = cents / 100
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}k`
  }
  return formatBRL(cents)
}
