'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building, Users, MessageCircle, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  const { data: settings } = useQuery<any>({
    queryKey: ['settings'],
    queryFn: () => api.get('/api/v1/admin/settings'),
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie as configurações da sua imobiliária</p>
      </div>

      <Tabs defaultValue="agency">
        <TabsList>
          <TabsTrigger value="agency" className="gap-2"><Building className="h-4 w-4" />Imobiliária</TabsTrigger>
          <TabsTrigger value="team" className="gap-2"><Users className="h-4 w-4" />Equipe</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2"><MessageCircle className="h-4 w-4" />WhatsApp</TabsTrigger>
          <TabsTrigger value="lgpd" className="gap-2"><Shield className="h-4 w-4" />LGPD</TabsTrigger>
        </TabsList>

        <TabsContent value="agency" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Imobiliária</CardTitle>
              <CardDescription>Informações básicas da sua empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Imobiliária</Label>
                  <Input defaultValue={settings?.name} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input defaultValue={settings?.cnpj} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" defaultValue={settings?.email} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input defaultValue={settings?.phone} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input type="color" className="w-12 h-10 p-1" defaultValue={settings?.primaryColor ?? '#2563EB'} />
                    <Input defaultValue={settings?.primaryColor ?? '#2563EB'} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Input defaultValue={settings?.timezone ?? 'America/Sao_Paulo'} />
                </div>
              </div>
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Equipe</CardTitle>
              <CardDescription>Adicione e gerencie os membros da equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/settings/users/new">Convidar Membro</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integração WhatsApp</CardTitle>
              <CardDescription>Configure os números do WhatsApp Business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number ID (Meta)</Label>
                <Input placeholder="123456789012345" />
              </div>
              <div className="space-y-2">
                <Label>Access Token</Label>
                <Input type="password" placeholder="EAAxxxxxxxx..." />
              </div>
              <Button>Conectar WhatsApp</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lgpd" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Conformidade LGPD</CardTitle>
              <CardDescription>Configure as políticas de privacidade e proteção de dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do DPO</Label>
                  <Input defaultValue={settings?.dpoName} placeholder="Nome do responsável" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail do DPO</Label>
                  <Input type="email" defaultValue={settings?.dpoEmail} placeholder="dpo@empresa.com" />
                </div>
              </div>
              <Button>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
