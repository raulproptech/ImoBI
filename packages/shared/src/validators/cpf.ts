/**
 * Validates Brazilian CPF (Cadastro de Pessoas Fisicas)
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')

  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false // all same digits

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]!) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned[9]!)) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]!) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0

  return remainder === parseInt(cleaned[10]!)
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function maskCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})\d{3}(\d{3})(\d{2})/, '$1.***.$3-$4')
}
