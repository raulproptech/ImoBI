'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Users2, Star, Phone, MapPin, TrendingUp, DollarSign, Award, Filter, Search } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import { useState } from 'react'

const agents = [
  {
    id: '1',
    name: 'Maria Santos',
    creci: 'RS-12345',
    phone: '(51) 99988-7766',
    email: 'maria@imobi.com.br',
    dealsClosed: 12,
    revenue: 240000,
    performance: 92,
    status: 'ativo',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop',
  },
  {
    id: '2',
    name: 'João Oliveira',
    creci: 'SC-67890',
    phone: '(48) 99912-3456',
    email: 'joao@imobi.com.br',
    dealsClosed: 8,
    revenue: 180000,
    performance: 78,
    status: 'ativo',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
  },
  {
    id: '3',
    name: 'Ana Costa',
    creci: 'PR-11223',
    phone: '(41) 99876-5432',
    email: 'ana@imobi.com.br',
    dealsClosed: 15,
    revenue: 320000,
    performance: 95,
    status: 'topper',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
  },
  {
    id: '4',
    name: 'Carlos Lima',
    creci: 'RS-44556',
    phone: '(51) 99765-4321',
    email: 'carlos@imobi.com.br',
    dealsClosed: 5,
    revenue: 95000,
    performance: 65,
    status: 'junior',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  },
]

export default function CorretoresPage() {
  const [search, setSearch] = useState('')

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.creci.toLowerCase().includes(search.toLowerCase())
  )

  const performanceData = [
    { name: 'Maria', performance: 92 },
    { name: 'João', performance: 78 },
    { name: 'Ana', performance: 95 },
    { name: 'Carlos', performance: 65 },
  ]

  const statusBadges = {
    ativo: 'bg-green-100 text-green-800',
    topper: 'bg-emerald-100 text-emerald-800',
    junior: 'bg-blue-100 text-blue-800',
  } as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Corretores</h1>
          <p className="text-muted-foreground">Performance e metas da equipe</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button asChild>
            <Link href="/corretores/new">
              <Users2 className="h-4 w-4 mr-2" />
              Novo Corretor
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CRECI..."
              className="pl-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="performance" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-lg transition-all group">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <Badge className={statusBadges[agent.status as keyof typeof statusBadges]}>
                  {agent.status === 'topper' ? 'Top Performer' : agent.status === 'junior' ? 'Júnior' : 'Ativo'}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current text-yellow-400" />
                  <span className="text-sm font-medium">{agent.performance}%</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={agent.avatar} alt={agent.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                    {agent.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">{agent.creci}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Negócios fechados</span>
                  <span className="font-medium">{agent.dealsClosed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Receita gerada</span>
                  <DollarSign className="h-3 w-3" />
                  <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agent.revenue / 100)}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" size="sm" className="flex-1 h-9">
                  <Phone className="h-3 w-3 mr-1" />
                  WhatsApp
                </Button>
                <Button size="sm" className="h-9">Detalhes</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhum corretor encontrado</h3>
            <p className="text-muted-foreground mb-6">Adicione o primeiro membro da equipe</p>
            <Button asChild>
              <Link href="/corretores/new">
                Adicionar primeiro corretor
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

