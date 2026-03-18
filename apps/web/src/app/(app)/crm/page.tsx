'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatBRL } from '@imobi/shared'
import { Search, Plus, MessageCircle, Phone, Star, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function CRMPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const demo = JSON.parse(localStorage.getItem('demoContacts') || '[]')
    if (demo.length === 0) {
      const seeds = [
        {
          id: crypto.randomUUID(),
          fullName: 'Maria Santos',
          email: 'maria@imobiliaria.com.br',
          phoneWhatsapp: '(51) 99988-7766',
          type: 'lead',
          leadScore: 85,
          createdAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          fullName: 'João Oliveira',
          email: 'joao@poaimobi.com.br',
          phoneWhatsapp: '(48) 99912-3456',
          type: 'client',
          leadScore: 92,
          createdAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          fullName: 'Ana Costa',
          email: 'ana@sulimoveis.com.br',
          phoneWhatsapp: '(41) 99876-5432',
          type: 'owner',
          leadScore: 75,
          createdAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem('demoContacts', JSON.stringify(seeds))
    }
  }, [])

  // Mock local for demo (DB Docker later)
  const [contacts, setContacts] = useState<any[]>([])
  const demoContacts = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('demoContacts') || '[]') : []
  
  const filteredContacts = demoContacts.filter((c: any) => 
    c.fullName?.toLowerCase().includes(search.toLowerCase())
  ).slice((page - 1) * 20, page * 20)

  const isLoading = false // demo instant

  function getScoreColor(score: number) {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-gray-300'
  }

  function getTypeBadge(type: string) {
    const map: Record<string, string> = {
      lead: 'bg-blue-100 text-blue-700',
      client: 'bg-green-100 text-green-700',
      owner: 'bg-purple-100 text-purple-700',
    } as const
    const labels: Record<string, string> = {
      lead: 'Lead',
      client: 'Cliente',
      owner: 'Proprietário',
    } as const
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-gray-300'
  }
    return { className: map[type] ?? 'bg-gray-100 text-gray-700', label: labels[type] ?? type }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
<h1 className="text-2xl font-bold">Cadastros</h1>
          <p className="text-muted-foreground text-sm">
            {demoContacts.length} contatos
          </p>
        </div>
        <Button asChild>
          <Link href="/crm/new">
            <Plus className="h-4 w-4 mr-2" /> Novo Contato
          </Link>
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="space-y-2">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))
        ) : filteredContacts.map((contact: any) => {
          const initials = contact.fullName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
          const dataCad = new Date(contact.createdAt).toLocaleDateString('pt-BR')

          return (
            <Card key={contact.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm font-medium">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{contact.fullName}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Email:</span>
                      <p>{contact.email || '-'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Telefone:</span>
                      <p>{contact.phoneWhatsapp || '-'}</p>
                    </div>
                    <div>
                      <span className="font-medium">CPF:</span>
                      <p>{contact.cpf || '-'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium">Interesse:</span>
                      <p className="line-clamp-2">{contact.interest || '-'}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cadastrado: {dataCad}
                  </div>
                  <div className="flex gap-2 pt-2">
                    {contact.phoneWhatsapp && (
                      <Button variant="ghost" size="sm" className="h-8">
                        WhatsApp
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="h-8 flex-1">
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pagination */}
      {demoContacts.length > 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline" size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm py-2 px-3">
            Página {page} de {Math.ceil(demoContacts.length / 20)}
          </span>
          <Button
            variant="outline" size="sm"
            disabled={page * 20 >= demoContacts.length}
            onClick={() => setPage(p => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
