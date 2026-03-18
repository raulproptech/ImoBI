import { api } from './api'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
  avatarUrl?: string
}

export interface AuthTenant {
  id: string
  name: string
  slug: string
  logoUrl?: string
  primaryColor?: string
}

export interface AuthState {
  user: AuthUser | null
  tenant: AuthTenant | null
  accessToken: string | null
}

export async function login(email: string, password: string) {
  // Mock for dev - real API depois
  if (process.env.NODE_ENV === 'development' && email === 'admin@imobi.com' && password === 'admin123') {
    const mockResult = {
      accessToken: 'mock-jwt-token-dev',
      refreshToken: 'mock-refresh-dev',
      user: {
        id: '1',
        email: 'admin@imobi.com',
        fullName: 'Admin ImoBI',
        role: 'owner'
      },
      tenant: {
        id: '1',
        name: 'Imobiliária Demo',
        slug: 'demo'
      }
    }
    localStorage.setItem('access_token', mockResult.accessToken)
    localStorage.setItem('refresh_token', mockResult.refreshToken)
    return mockResult
  }

  const result = await api.post<{
    accessToken: string
    refreshToken: string
    user: AuthUser
    tenant: AuthTenant
  }>('/auth/login', { email, password })

  localStorage.setItem('access_token', result.accessToken)
  localStorage.setItem('refresh_token', result.refreshToken)

  return result
}

export async function logout() {
  try {
    await api.post('/auth/logout', {})
  } finally {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/login'
  }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token')
}

export function initAuth(setAuth: (user: AuthUser, tenant: AuthTenant, token: string) => void) {
  const accessToken = localStorage.getItem('access_token')
  if (!accessToken || process.env.NODE_ENV !== 'development') return

  // Mock restore para dev
  const mockUser: AuthUser = {
    id: '1',
    email: 'admin@imobi.com',
    fullName: 'Admin ImoBI',
    role: 'owner'
  }
  const mockTenant: AuthTenant = {
    id: '1',
    name: 'Imobiliária Demo',
    slug: 'demo'
  }
  
  setAuth(mockUser, mockTenant, accessToken)
}
