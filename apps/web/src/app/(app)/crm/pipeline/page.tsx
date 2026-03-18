'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useState } from 'react'
import { formatBRL } from '@imobi/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus, DollarSign, User, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Stage {
  id: string
  name: string
  color: string
  position: number
  totalDeals: number
  totalValue: number
  deals: Deal[]
}

interface Deal {
  id: string
  title: string
  value?: number
  contact: { id: string; fullName: string; avatarUrl?: string; phoneWhatsapp?: string }
  assignedAgent?: { id: string; fullName: string; avatarUrl?: string }
  daysInStage: number
  lastActivityAt?: string
}

export default function PipelinePage() {
  const qc = useQueryClient()
  const [dragging, setDragging] = useState<{ dealId: string; fromStageId: string } | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  // In a real app, we'd get the default pipeline ID first
  const { data: pipelines } = useQuery<any[]>({
    queryKey: ['pipelines'],
    queryFn: () => api.get('/api/v1/crm/pipelines'),
  })

  const defaultPipeline = pipelines?.[0]

  const { data: stages, isLoading } = useQuery<Stage[]>({
    queryKey: ['pipeline-board', defaultPipeline?.id],
    queryFn: () => api.get(`/api/v1/crm/pipelines/${defaultPipeline!.id}/board`),
    enabled: !!defaultPipeline?.id,
  })

  const moveDealMutation = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: string; stageId: string }) =>
      api.patch(`/api/v1/crm/deals/${dealId}/stage`, { stageId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline-board'] }),
  })

  function handleDragStart(dealId: string, stageId: string) {
    setDragging({ dealId, fromStageId: stageId })
  }

  function handleDrop(toStageId: string) {
    if (!dragging || dragging.fromStageId === toStageId) return
    moveDealMutation.mutate({ dealId: dragging.dealId, stageId: toStageId })
    setDragging(null)
    setDragOver(null)
  }

  const totalDeals = stages?.reduce((s, st) => s + st.totalDeals, 0) ?? 0
  const totalValue = stages?.reduce((s, st) => s + st.totalValue, 0) ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {totalDeals} negociações · {formatBRL(totalValue)} em aberto
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/crm">Lista</Link>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Nova Negociação
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
        {isLoading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-72 h-96 bg-muted animate-pulse rounded-xl" />
            ))
          : stages?.map((stage) => (
              <div
                key={stage.id}
                className={cn(
                  'flex-shrink-0 w-72 flex flex-col rounded-xl border bg-muted/30 transition-colors',
                  dragOver === stage.id && 'ring-2 ring-primary bg-primary/5'
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Stage Header */}
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-sm font-semibold">{stage.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                        {stage.totalDeals}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {stage.totalValue > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 pl-4">
                      {formatBRL(stage.totalValue)}
                    </p>
                  )}
                </div>

                {/* Deal Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {stage.deals.map((deal) => {
                    const initials = deal.contact.fullName
                      .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={() => handleDragStart(deal.id, stage.id)}
                        onDragEnd={() => { setDragging(null); setDragOver(null) }}
                        className={cn(
                          'bg-background rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all',
                          dragging?.dealId === deal.id && 'opacity-40'
                        )}
                      >
                        <p className="text-sm font-medium leading-tight">{deal.title}</p>

                        {deal.value && (
                          <div className="flex items-center gap-1 mt-2">
                            <DollarSign className="h-3 w-3 text-green-500" />
                            <span className="text-xs font-semibold text-green-600">
                              {formatBRL(deal.value)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {deal.contact.fullName.split(' ')[0]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {deal.contact.phoneWhatsapp && (
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MessageCircle className="h-3 w-3" />
                              </Button>
                            )}
                            {deal.daysInStage > 0 && (
                              <span className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                                deal.daysInStage > 7
                                  ? 'bg-red-100 text-red-600'
                                  : deal.daysInStage > 3
                                    ? 'bg-yellow-100 text-yellow-600'
                                    : 'bg-gray-100 text-gray-500'
                              )}>
                                {deal.daysInStage}d
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Empty state drop zone */}
                  {stage.deals.length === 0 && (
                    <div className={cn(
                      'h-20 rounded-lg border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground',
                      dragOver === stage.id ? 'border-primary text-primary' : 'border-muted-foreground/20'
                    )}>
                      {dragOver === stage.id ? 'Soltar aqui' : 'Sem negociações'}
                    </div>
                  )}
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
