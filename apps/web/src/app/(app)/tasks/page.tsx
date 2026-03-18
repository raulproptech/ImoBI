'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, CheckSquare, Clock, AlertCircle } from 'lucide-react'
import { formatDateBR } from '@imobi/shared'
import { cn } from '@/lib/utils'

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-gray-100 text-gray-600', label: 'Baixa' },
  medium: { color: 'bg-blue-100 text-blue-700', label: 'Média' },
  high: { color: 'bg-orange-100 text-orange-700', label: 'Alta' },
  urgent: { color: 'bg-red-100 text-red-700', label: 'Urgente' },
}

const statusConfig: Record<string, { color: string; label: string }> = {
  todo: { color: 'text-gray-500', label: 'A Fazer' },
  in_progress: { color: 'text-blue-500', label: 'Em Andamento' },
  review: { color: 'text-yellow-500', label: 'Revisão' },
  done: { color: 'text-green-500', label: 'Concluído' },
  cancelled: { color: 'text-red-500', label: 'Cancelado' },
}

export default function TasksPage() {
  const qc = useQueryClient()
  const { data: tasks, isLoading } = useQuery<any[]>({
    queryKey: ['tasks'],
    queryFn: () => api.get('/api/v1/admin/tasks'),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/v1/admin/tasks/${id}`, { status: 'done' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const pending = tasks?.filter(t => t.status !== 'done' && t.status !== 'cancelled') ?? []
  const done = tasks?.filter(t => t.status === 'done') ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <p className="text-sm text-muted-foreground">{pending.length} pendentes</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nova Tarefa
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading
          ? [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)
          : pending.map((task: any) => {
            const priority = priorityConfig[task.priority] ?? priorityConfig.medium!
            const status = statusConfig[task.status] ?? statusConfig.todo!
            const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status !== 'done'

            return (
              <Card key={task.id} className={cn('hover:shadow-sm transition-shadow', isOverdue && 'border-red-200')}>
                <CardContent className="p-4 flex items-center gap-4">
                  <button
                    className="flex-shrink-0"
                    onClick={() => completeMutation.mutate(task.id)}
                  >
                    <CheckSquare className={cn('h-5 w-5', status.color)} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{task.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.color}`}>
                        {priority.label}
                      </span>
                      {isOverdue && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Atrasada
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
                    )}
                    {task.dueAt && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDateBR(task.dueAt)}
                      </div>
                    )}
                  </div>
                  {task.assignedToUser && (
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {task.assignedToUser.fullName?.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </CardContent>
              </Card>
            )
          })}
      </div>

      {done.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">{done.length} concluídas</p>
          <div className="space-y-1 opacity-60">
            {done.slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                <CheckSquare className="h-4 w-4 text-green-500" />
                <p className="text-sm line-through text-muted-foreground">{task.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
