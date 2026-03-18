'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Globe, FileText, Zap, Clock, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

const portals = [
  {
    id: '1',
    name: 'Zap Imóveis',
    url: 'zapimoveis.com.br/imobi',
    status: 'sincronizado' as const,
    lastSync: '14/03/2025 09:30',
    listings: 47,
    leads: 12,
    type: 'portal',
  },
  {
    id: '2',
    name: 'Viva Real',
    url: 'vivareal.com.br/imobi',
    status: 'pendente' as const,
    lastSync: '13/03/2025 16:45',
    listings: 23,
    leads: 8,
    type: 'portal',
  },
  {
    id: '3',
    name: 'OLX Imóveis',
    url: 'olx.com.br/imobi',
    status: 'erro' as const,
    lastSync: '14/03/2025 08:20',
    listings: 0,
    leads: 0,
    type: 'portal',
  },
  {
    id: '4',
    name: 'XML Bulk Zap',
    url: 'bulk.xml',
    status: 'sincronizado' as const,
    lastSync: '14/03/2025 10:15',
    listings: 67,
    leads: 23,
    type: 'xml',
  },
]

export default function PortaisPage() {
  const [activeTab, setActiveTab] = useState('ativos')

  const statusColors = {
    sincronizado: 'bg-green-100 text-green-800',
    pendente: 'bg-yellow-100 text-yellow-800',
    erro: 'bg-destructive text-destructive-foreground',
  } as const

  const tabs = [
    { id: 'ativos', label: 'Ativos', count: 2 },
    { id: 'pendente', label: 'Pendente', count: 1 },
    { id: 'erro', label: 'Erros', count: 1 },
  ]

  const filteredPortals = portals.filter(p => {
    if (activeTab === 'ativos') return p.status === 'sincronizado'
    if (activeTab === 'pendente') return p.status === 'pendente'
    if (activeTab === 'erro') return p.status === 'erro'
    return true
  })

  const generateXML = () => {
    // Mock XML generation
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<listings>
  <listing>
    <code>POA-001</code>
    <title>Apartamento Petrópolis</title>
    <price>850000</price>
  </listing>
</listings>`
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'imobi-bulk.xml'
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portais Imobiliários</h1>
          <p className="text-muted-foreground">Sincronize imóveis e capture leads automáticos</p>
        </div>
        <Button onClick={generateXML}>
          <Download className="h-4 w-4 mr-2" />
          Gerar XML Bulk
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-6">
          <div className="flex -space-x-px">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                className="rounded-none rounded-l-lg data-[state=active]:rounded-r-lg"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <Badge className="ml-2 h-5 w-8 px-1 text-xs">{tab.count}</Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPortals.map((portal) => (
          <Card key={portal.id} className="group hover:shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge className={statusColors[portal.status]} variant="secondary">
                  {portal.status === 'sincronizado' ? 'OK' : portal.status}
                </Badge>
                <div className="flex gap-1 text-xs opacity-75 group-hover:opacity-100">
                  <Clock className="h-3 w-3" />
                  {portal.lastSync}
                </div>
              </div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {portal.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <a href={portal.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {portal.url}
                </a>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                  <div className="font-mono font-bold text-lg">{portal.listings}</div>
                  <span className="text-muted-foreground">Anúncios</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                  <div className="font-mono font-bold text-lg">{portal.leads}</div>
                  <span className="text-muted-foreground">Leads</span>
                </div>
                {portal.type === 'xml' && (
                  <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground">Bulk</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-3">
                <Button variant="ghost" size="sm" className="flex-1">
                  Sincronizar
                </Button>
                <Button size="sm" variant="outline" className="h-9">
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPortals.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhum portal configurado</h3>
            <p className="text-muted-foreground mb-6">Conecte portais para publicar imóveis automaticamente</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1">
                Configurar Zap Imóveis
              </Button>
              <Button variant="outline" className="flex-1">
                Gerar XML
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

