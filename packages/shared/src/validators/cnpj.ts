/**
 * Validates Brazilian CNPJ (Cadastro Nacional da Pessoa Juridica)
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')

  if (cleaned.length !== 14) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  const calcDigit = (str: string, weights: number[]): number => {
    let sum = 0
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(str[i]!) * weights[i]!
    }
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const d1 = calcDigit(cleaned, weights1)
  if (d1 !== parseInt(cleaned[12]!)) return false

  const d2 = calcDigit(cleaned, weights2)
  return d2 === parseInt(cleaned[13]!)
}

export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '')
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}
