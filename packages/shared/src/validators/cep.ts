export function validateCEP(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '')
  return cleaned.length === 8
}

export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '')
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
}

export interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
  erro?: boolean
}

export async function fetchCEP(cep: string): Promise<ViaCEPResponse | null> {
  const cleaned = cep.replace(/\D/g, '')
  if (!validateCEP(cleaned)) return null

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
    const data = await response.json() as ViaCEPResponse
    if (data.erro) return null
    return data
  } catch {
    return null
  }
}
