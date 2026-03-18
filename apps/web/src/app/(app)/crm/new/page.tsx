'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const schema = z.object({
  fullName: z.string().min(2, "Nome completo obrigatório"),
  email: z.string().email("E-mail inválido").optional(),
  phoneWhatsapp: z.string().optional(),
  cpf: z.string().optional(),
  interest: z.string().optional(),
  type: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewContactPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "lead",
    },
  })

async function onSubmit(data: FormData) {
    try {
      // Mock local for demo (DB Docker later)
      const contacts = JSON.parse(localStorage.getItem('demoContacts') || '[]')
      const newContact = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() }
      contacts.unshift(newContact)
      localStorage.setItem('demoContacts', JSON.stringify(contacts))
      
      toast({
        title: "Contato criado!",
        description: `${data.fullName} adicionado ao CRM (demo local).`,
      })
      router.push("/crm")
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Falha ao criar contato",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Novo Contato</h1>
      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input {...register("phoneWhatsapp")} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input {...register("cpf")} placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>Interesse</Label>
              <Input {...register("interest")} placeholder="Apartamento 3q POA, cobertura Sul, etc." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input {...register("fullName")} />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input {...register("phoneWhatsapp")} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
"Adicionar Cadastro"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
