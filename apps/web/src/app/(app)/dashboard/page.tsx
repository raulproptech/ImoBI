'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatBRL, formatBRLCompact } from '@imobi/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, MessageCircle, TrendingUp, DollarSign, Clock, Star } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

interface DashboardData {
  leads: { new_leads: number; converted: number; hot_leads: number; avg_score: number }
  properties: { active: number; sold_period: number; draft: number; avg_days_active: number }
  financial: { income_period: number; expense_period: number; pending_income: number; pending_commissions: number }
  whatsapp: { open_conversations: number; waiting_agent: number; new_conversations: number; avg_response_time_min: number }
}

function StatCard({
  title, value, subtitle, icon: Icon, trend, color = 'blue'
}: {
  title: string; value: string; subtitle?: string
  icon: React.ElementType; trend?: string; color?: string
}) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    orange: 'bg-orange-500/10 text-orange-600',
    purple: 'bg-purple-500/10 text-purple-600',
  } as const

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && <p className="text-xs text-green-600 font-medium mt-1">{trend}</p>}
          </div>
          <div className={`p-3 rounded-xl ${colorMap[color as keyof typeof colorMap] ?? colorMap.blue}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api.get('/api/v1/dashboard/overview'),
  })

  const { data: funnel } = useQuery<any>({
    queryKey: ['dashboard', 'funnel'],
    queryFn: () => api.get('/api/v1/dashboard/funnel'),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const funnelData = funnel ? [
    { name: 'Leads', value: Number(funnel.total_leads ?? 0) },
    { name: 'Contactados', value: Number(funnel.contacted ?? 0) },
    { name: 'Em negociação', value: Number(funnel.in_deal ?? 0) },
    { name: 'Fechados', value: Number(funnel.won ?? 0) },
  ] : []

  const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral dos últimos 30 dias</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Novos Leads"
          value={String(data?.leads.new_leads ?? 0)}
          subtitle={`${data?.leads.hot_leads ?? 0} leads quentes`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Imóveis Ativos"
          value={String(data?.properties.active ?? 0)}
          subtitle={`${data?.properties.sold_period ?? 0} vendidos no período`}
          icon={Building2}
          color="green"
        />
        <StatCard
          title="Receita do Período"
          value={formatBRLCompact((data?.financial.income_period ?? 0))}
          subtitle={`${formatBRLCompact(data?.financial.pending_income ?? 0)} a receber`}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Conversas WhatsApp"
          value={String(data?.whatsapp.open_conversations ?? 0)}
          subtitle={`${data?.whatsapp.waiting_agent ?? 0} aguardando atendimento`}
          icon={MessageCircle}
          color="orange"
        />
        <StatCard
          title="Score Médio de Leads"
          value={`${Math.round(data?.leads.avg_score ?? 0)}/100`}
          subtitle="Qualidade da base"
          icon={Star}
          color="orange"
        />
        <StatCard
          title="Comissões a Pagar"
          value={formatBRLCompact(data?.financial.pending_commissions ?? 0)}
          subtitle="Aprovadas e pendentes"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Tempo Médio de Resposta"
          value={`${Math.round(data?.whatsapp.avg_response_time_min ?? 0)} min`}
          subtitle="WhatsApp"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Dias Médio em Carteira"
          value={`${Math.round(data?.properties.avg_days_active ?? 0)} dias`}
          subtitle="Imóveis ativos"
          icon={Building2}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index] ?? '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion rates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxas de Conversão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Lead → Contato', value: funnel?.contact_rate ?? 0, color: '#3B82F6' },
              { label: 'Contato → Negociação', value: funnel?.deal_rate ?? 0, color: '#8B5CF6' },
              { label: 'Negociação → Fechamento', value: funnel?.win_rate ?? 0, color: '#10B981' },
            ].map(({ label, value, color }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{Number(value).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(Number(value), 100)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
