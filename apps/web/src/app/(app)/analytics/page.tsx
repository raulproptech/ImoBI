'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatBRL } from '@imobi/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

export default function AnalyticsPage() {
  const { data: agents } = useQuery<any[]>({
    queryKey: ['analytics', 'agents'],
    queryFn: () => api.get('/api/v1/analytics/agents-performance'),
  })

  const { data: sources } = useQuery<any[]>({
    queryKey: ['analytics', 'sources'],
    queryFn: () => api.get('/api/v1/analytics/lead-sources'),
  })

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Métricas e desempenho da equipe</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desempenho por Corretor</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {agents?.slice(0, 8).map((agent: any, i) => (
                <div key={agent.id} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={agent.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {agent.full_name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{agent.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.total_leads ?? 0} leads · {agent.conversations ?? 0} conversas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {agent.deals_won ?? 0} fechamentos
                    </p>
                    {agent.revenue_won && (
                      <p className="text-xs text-muted-foreground">{formatBRL(agent.revenue_won)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Origens de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sources ?? []}
                  dataKey="total_leads"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                >
                  {(sources ?? []).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length] ?? '#3B82F6'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} leads`, 'Total']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-2">
              {sources?.map((source: any, i) => (
                <div key={source.source} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{source.source}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{source.total_leads} leads</span>
                    <span className="text-green-600 font-medium">{source.conversion_rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
