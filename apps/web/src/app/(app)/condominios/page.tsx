'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building2, Users, MapPin, Phone, Mail, Home, Search } from 'lucide-react'
import Link from 'next/link'

export default function CondominiosPage() {
  const [search, setSearch] = useState('')

  // Mock data for condominiums
  const condos = [
    {
      id: '1',
      name: 'Condomínio Petrópolis Park',
      address: 'Rua das Flores, 123 - Petrópolis, POA',
      units: 150,
      manager: 'João Silva',
      phone: '(51) 99988-7766',
      email: 'admin@petropolispark.com.br',
      status: 'ativo' as const,
      revenue: 150000,
    },
    {
      id: '2',
      name: 'Residencial Jurerê Internacional',
      address: 'Av. Central, 456 - Jurerê, Florianópolis',
      units: 320,
      manager: 'Maria Santos',
      phone: '(48) 99912-3456',
      email: 'gestao@jure.re',
      status: 'manutencao' as const,
      revenue: 420000,
    },
    {
      id: '3',
      name: 'Batel Residence',
      address: 'Av. do Batel, 789 - Batel, Curitiba',
      units: 85,
      manager: 'Carlos Oliveira',
      phone: '(41) 99876-5432',
      email: 'contato@batelresidence.com.br',
      status: 'ativo' as const,
      revenue: 95000,
    },
  ]

  const filteredCondos = condos.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors = {
    ativo: 'bg-green-100 text-green-800',
    manutencao: 'bg-yellow-100 text-yellow-800',
  } as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Condomínios</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus condomínios e administradoras</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button asChild>
            <Link href="/condominios/new">
              <Building2 className="h-4 w-4 mr-2" />
              Novo Condomínio
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
              placeholder="Buscar por nome ou endereço..."
              className="pl-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCondos.map((condo) => (
          <Card key={condo.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge className={statusColors[condo.status]} variant="secondary">
                  {condo.status === 'ativo' ? 'Ativo' : 'Manutenção'}
                </Badge>
              </div>
              <CardTitle className="text-xl leading-tight">{condo.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{condo.address}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  {condo.units} unidades
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {condo.manager}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" size="sm" className="flex-1 h-8">
                  <Phone className="h-3 w-3 mr-1" />
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCondos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhum condomínio encontrado</h3>
            <p className="text-muted-foreground mb-6">Comece adicionando seu primeiro condomínio</p>
            <Button asChild>
              <Link href="/condominios/new">
                Adicionar primeiro condomínio
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

