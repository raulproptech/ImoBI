'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Mail, MessageCircle, BarChart3, Eye, MousePointer, UserMinus } from 'lucide-react'
import Link from 'next/link'
import { formatDateBR } from '@imobi/shared'

const typeIcons = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: MessageCircle,
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  paused: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  sending: 'Enviando',
  sent: 'Enviada',
  paused: 'Pausada',
  cancelled: 'Cancelada',
}

export default function MarketingPage() {
  const { data: campaigns, isLoading } = useQuery<any[]>({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/api/v1/marketing/campaigns'),
  })

  const { data: landingPages } = useQuery<any[]>({
    queryKey: ['landing-pages'],
    queryFn: () => api.get('/api/v1/marketing/landing-pages'),
  })

  const totalSent = campaigns?.reduce((s, c) => s + (c.sent ?? 0), 0) ?? 0
  const totalOpened = campaigns?.reduce((s, c) => s + (c.opened ?? 0), 0) ?? 0
  const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-sm text-muted-foreground">Campanhas, e-mails e landing pages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/marketing/landing-pages/new">
              <Plus className="h-4 w-4 mr-2" /> Landing Page
            </Link>
          </Button>
          <Button asChild>
            <Link href="/marketing/campaigns/new">
              <Plus className="h-4 w-4 mr-2" /> Nova Campanha
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Campanhas', value: String(campaigns?.length ?? 0), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'E-mails Enviados', value: String(totalSent.toLocaleString('pt-BR')), icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
          { title: 'Taxa Média de Abertura', value: `${avgOpenRate}%`, icon: Eye, color: 'text-green-600', bg: 'bg-green-50' },
          { title: 'Landing Pages', value: String(landingPages?.length ?? 0), icon: MousePointer, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Campanhas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/marketing/campaigns">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {isLoading
                ? [...Array(4)].map((_, i) => <div key={i} className="h-14 mx-4 my-2 bg-muted animate-pulse rounded-lg" />)
                : campaigns?.slice(0, 6).map((campaign: any) => {
                    const Icon = typeIcons[campaign.type as keyof typeof typeIcons] ?? Mail
                    const openRate = campaign.sent > 0
                      ? ((campaign.opened / campaign.sent) * 100).toFixed(1)
                      : '0'

                    return (
                      <div key={campaign.id} className="px-5 py-3 flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.sent > 0 ? `${campaign.sent.toLocaleString('pt-BR')} enviados · ${openRate}% abertos` : 'Não enviada'}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[campaign.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[campaign.status] ?? campaign.status}
                        </span>
                      </div>
                    )
                  })}
              {campaigns?.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma campanha criada ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Landing Pages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Landing Pages</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/marketing/landing-pages">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {landingPages?.slice(0, 6).map((page: any) => {
                const convRate = page.viewCount > 0
                  ? ((page.conversionCount / page.viewCount) * 100).toFixed(1)
                  : '0'

                return (
                  <div key={page.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{page.title}</p>
                        {page.isPublished && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                            Online
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(page.viewCount ?? 0).toLocaleString('pt-BR')} visitas · {convRate}% conversão
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {page.viewCount ?? 0}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <MousePointer className="h-3 w-3" />
                        {page.conversionCount ?? 0}
                      </div>
                    </div>
                  </div>
                )
              })}
              {landingPages?.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma landing page criada ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
