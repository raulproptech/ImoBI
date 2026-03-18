'use client'
import { Bell, Search } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function AppHeader() {
  const { user } = useAuthStore()

  const initials = user?.fullName
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() ?? 'U'

  return (
    <header className="h-16 border-b flex items-center px-6 gap-4 bg-background/95 backdrop-blur">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar leads, imóveis..." className="pl-9 h-9" />
        </div>
      </div>
      <div className="flex items-center gap-3 ml-auto">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
