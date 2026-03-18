import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, AuthTenant } from '@/lib/auth'

interface AuthStore {
  user: AuthUser | null
  tenant: AuthTenant | null
  accessToken: string | null
  isLoading: boolean
  setAuth: (user: AuthUser, tenant: AuthTenant, token: string) => void
  clearAuth: () => void
  init: () => void
}

export const useAuthStore = create<AuthStore>()(
persist(
    (set, get) => ({
      user: null,
      tenant: null,
      accessToken: null,
      isLoading: true,
      setAuth: (user, tenant, accessToken) => {
        set({ user, tenant, accessToken, isLoading: false })
        localStorage.setItem('access_token', accessToken)
      },
      clearAuth: () => {
        set({ user: null, tenant: null, accessToken: null, isLoading: false })
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      },
      init: () => {
        const token = localStorage.getItem('access_token')
        if (!token || process.env.NODE_ENV !== 'development') {
          set({ isLoading: false })
          return
        }
        // Mock init dev
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
        set({ user: mockUser, tenant: mockTenant, accessToken: token, isLoading: false })
      }
    }),
    { name: 'imobi-auth' }
  )
)
