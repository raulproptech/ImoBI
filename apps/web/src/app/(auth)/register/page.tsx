'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Loader2 } from 'lucide-react'

const schema = z.object({
  agencyName: z.string().min(2, 'Nome da imobiliária deve ter ao menos 2 caracteres'),
  cnpj: z.string().optional(),
  fullName: z.string().min(2, 'Nome completo obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore(s => s.setAuth)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      const result = await api.post<any>('/auth/register', data)
      localStorage.setItem('access_token', result.accessToken)
      setAuth(result.user, result.tenant, result.accessToken)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Erro ao cadastrar')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>14 dias grátis, sem cartão de crédito</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Imobiliária</Label>
              <Input placeholder="Imobiliária Exemplo Ltda" {...register('agencyName')} />
              {errors.agencyName && <p className="text-sm text-destructive">{errors.agencyName.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Seu nome completo</Label>
                <Input placeholder="João Silva" {...register('fullName')} />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>CNPJ (opcional)</Label>
                <Input placeholder="00.000.000/0001-00" {...register('cnpj')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" placeholder="voce@email.com" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" {...register('password')} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input placeholder="(11) 99999-9999" {...register('phone')} />
              </div>
            </div>
            {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar conta gratuita
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta? <a href="/login" className="text-primary hover:underline">Entrar</a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
