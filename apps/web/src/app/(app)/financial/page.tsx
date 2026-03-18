'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatBRL, formatDateBR } from '@imobi/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
}
const statusLabels: Record<string, string> = {
  pending: 'Pendente', completed: 'Pago', failed: 'Falhou', cancelled: 'Cancelado',
}

export default function FinancialPage() {
  const { data: transactions } = useQuery<{ data: any[]; meta: any }>({
    queryKey: ['transactions'],
    queryFn: () => api.get('/api/v1/financial/transactions?pageSize=15'),
  })

  const { data: cashFlow } = useQuery<any[]>({
    queryKey: ['cash-flow'],
    queryFn: () => api.get('/api/v1/financial/reports/cash-flow?period=30'),
  })

  const { data: commissions } = useQuery<any[]>({
    queryKey: ['commissions'],
    queryFn: () => api.get('/api/v1/financial/commissions?status=pending'),
  })

  const totalIncome = transactions?.data
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0) ?? 0

  const totalExpense = transactions?.data
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Controle financeiro completo</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nova Transação
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Receitas (período)', value: formatBRL(totalIncome), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { title: 'Despesas (período)', value: formatBRL(totalExpense), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
          { title: 'Resultado', value: formatBRL(totalIncome - totalExpense), icon: DollarSign, color: totalIncome > totalExpense ? 'text-green-600' : 'text-red-600', bg: 'bg-blue-50' },
          { title: 'Comissões Pendentes', value: String(commissions?.length ?? 0), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fluxo de Caixa (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cashFlow ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tickFormatter={(v) => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `R$${(v / 100).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: any) => formatBRL(v)}
                  labelFormatter={(l) => formatDateBR(l)}
                />
                <Bar dataKey="income" name="Receita" fill="#10B981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" name="Despesa" fill="#EF4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {transactions?.data.slice(0, 8).map((tx: any) => (
                <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.dueDate ? formatDateBR(tx.dueDate) : '—'}
                      {tx.contact ? ` · ${tx.contact.fullName}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[tx.status] ?? 'bg-gray-100'}`}>
                      {statusLabels[tx.status] ?? tx.status}
                    </span>
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatBRL(tx.amount)}
                    </span>
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
