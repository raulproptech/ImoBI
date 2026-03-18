'use client'
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatBRL } from "@imobi/shared"
import { MapPin, Bed, Bath, Car, Ruler, Calendar, Link as LinkIcon } from "lucide-react"
import Link from "next/link"

export default function PropertiesPage() {
  const [properties] = useState([
    {
      id: "1",
      code: "POA-001",
      type: "Apartamento",
      location: "POA - Petrópolis",
      price: 850000,
      status: "Disponível",
      beds: 3,
      baths: 2,
      area: "120m²",
      date: "14/03/2025",
    },
    {
      id: "2",
      code: "FLN-002",
      type: "Cobertura",
      location: "Florianópolis - Jurerê",
      price: 2500000,
      status: "Indisponível",
      beds: 4,
      baths: 4,
      area: "350m²",
      date: "10/03/2025",
    },
    {
      id: "3",
      code: "CUR-003",
      type: "Casa",
      location: "Curitiba - Batel",
      price: 1200000,
      status: "Disponível",
      beds: 4,
      baths: 3,
      area: "200m²",
      date: "12/03/2025",
    },
  ])

  const statusColors = {
    "Disponível": "bg-green-100 text-green-800",
    "Indisponível": "bg-orange-100 text-orange-800",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Imóveis</h1>
          <p className="text-muted-foreground text-sm">
            {properties.length} imóveis cadastrados
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/new">
            Novo Imóvel
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Card key={property.id} className="hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Badge className={statusColors[property.status as keyof typeof statusColors]}>
                  {property.status}
                </Badge>
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-1">{property.code}</h2>
              <div className="flex items-center gap-1 mb-4">
                <MapPin className="h-3 w-3" />
                <span className="text-sm text-muted-foreground">{property.location}</span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold">{formatBRL(property.price)}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                <div className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  {property.beds}
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="h-3 w-3" />
                  {property.baths}
                </div>
                <div className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  2
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                {property.area} • Cadastrado {property.date}
              </div>
              <Button size="sm" className="w-full">
                Ver detalhes
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
