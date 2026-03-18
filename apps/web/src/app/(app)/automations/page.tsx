'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Zap, Clock, Settings, Play, Pause, MessageCircle, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

const automations = [
  {
    id: '1',
    name: 'Lead Distribution',
    description: 'Distribui leads por performance/round-robin',
    status: 'ativo' as const,
    triggers: 23,
    executions: 145,
    lastRun: '5min ago',
  },
  {
    id: '2',
    name: 'Follow-up WhatsApp',
    description: 'Envio automático após 3 dias sem resposta',
    status: 'pausado' as const,
    triggers: 89,
    executions: 67,
    lastRun: '2h ago',
  },
  {
    id: '3',
    name: 'Portal Sync',
    description: 'Sincroniza imóveis para portais a cada 15min',
    status: 'ativo' as const,
    triggers: 12,
    executions: 456,
    lastRun: '1min ago',
  },
  {
    id: '4',
    name: 'Relatório Semanal',
    description: 'Email automático performance corretores',
    status: 'ativo' as const,
    triggers: 4,
    executions: 28,
    lastRun: 'yesterday',
  },
]

export default function AutomationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const statusColors = {
    ativo: 'bg-green-100 text-green-800',
    pausado: 'bg-orange-100 text-orange-800',
    erro: 'bg-destructive text-destructive-foreground',
  } as const

  const toggleAutomation = (id: string, currentStatus: string) => {
    console.log('Toggle', id, currentStatus === 'ativo' ? 'pause' : 'activate')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automações</h1>
          <p className="text-muted-foreground">Configure regras inteligentes para seu fluxo</p>
        </div>
        <Button>
          <Zap className="h-4 w-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {automations.map((automation) => (
          <Card key={automation.id} className="group hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                    <Zap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg leading-tight">{automation.name}</CardTitle>
                    <CardDescription className="text-sm">{automation.description}</CardDescription>
                  </div>
                </div>
                <Badge className={statusColors[automation.status]}>
                  {automation.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-mono font-bold text-lg">{automation.triggers}</div>
                  <span className="text-xs text-muted-foreground">Triggers</span>
                </div>
                <div>
                  <div className="font-mono font-bold text-lg">{automation.executions}</div>
                  <span className="text-xs text-muted-foreground">Execuções</span>
                </div>
                <div>
                  <div className="font-mono font-bold text-sm">{automation.lastRun}</div>
                  <span className="text-xs text-muted-foreground">Última</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Switch
                  checked={automation.status === 'ativo'}
                  onCheckedChange={() => toggleAutomation(automation.id, automation.status)}
                  className="data-[state=checked]:bg-green-500"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start h-10"
                >
                  {automation.status === 'ativo' ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Ativar
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" className="h-10">
                  <Settings className="h-4 w-4 mr-1" />
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {automations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhuma automação configurada</h3>
            <p className="text-muted-foreground mb-6">Crie regras inteligentes para economizar tempo</p>
            <Button className="w-full md:w-auto">
              Criar primeira automação
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

