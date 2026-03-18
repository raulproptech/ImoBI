'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Fix default marker
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function NewPropertyPage() {
  const [position, setPosition] = useState<[number, number]>([-30.0331, -51.2300]) // Porto Alegre default

  function LocationMarker() {
    useMapEvents({
      click: (e) => {
        setPosition([e.latlng.lat, e.latlng.lng] as [number, number])
      },
    })
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Novo Imóvel</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input placeholder="Apartamento 3 quartos - Petrópolis" />
          </div>
          <div className="space-y-2">
            <Label>Preço</Label>
            <Input placeholder="R$ 850.000" />
          </div>
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input placeholder="90460-510" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quartos</Label>
              <Input type="number" placeholder="3" />
            </div>
            <div className="space-y-2">
              <Label>Banheiros</Label>
              <Input type="number" placeholder="2" />
            </div>
          </div>
          <Button className="w-full">Próximo Passo →</Button>
        </div>
        <div className="space-y-4">
          <Label>Localização no mapa</Label>
          <div className="h-96 rounded-xl border overflow-hidden">
            <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker />
              <Marker position={position}>
                <Popup>
                  Posição selecionada: <br />
                  Lat: {position[0].toFixed(4)} <br />
                  Lng: {position[1].toFixed(4)}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
          <div className="text-sm text-muted-foreground">
            Clique no mapa para definir localização do imóvel
          </div>
        </div>
      </div>
    </div>
  )
}
