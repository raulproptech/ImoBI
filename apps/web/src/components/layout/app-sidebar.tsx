'use client'

import Link from 'next/link'
import type { ReactElement } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageCircle,
  DollarSign,
  Megaphone,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
  Building,

  Users2,
  Globe,
  Zap
} from 'lucide-react'
import { logout } from '@/lib/auth'

type NavItem = {
  href: string
  label: string
  icon: (props: any) => ReactElement
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: (props) => <LayoutDashboard {...props} /> },
  { href: '/crm', label: 'Cadastros', icon: (props) => <Users {...props} /> },
  { href: '/properties', label: 'Imóveis', icon: (props) => <Building2 {...props} /> },
  { href: '/whatsapp', label: 'WhatsApp', icon: (props) => <MessageCircle {...props} /> },
  { href: '/financial', label: 'Financeiro', icon: (props) => <DollarSign {...props} /> },
  { href: '/marketing', label: 'Marketing', icon: (props) => <Megaphone {...props} /> },
  { href: '/tasks', label: 'Tarefas', icon: (props) => <CheckSquare {...props} /> },

  { href: '/corretores', label: 'Corretores', icon: (props) => <Users2 {...props} /> },
  { href: '/portais', label: 'Portais', icon: (props) => <Globe {...props} /> },
  { href: '/automations', label: 'Automações', icon: (props) => <Zap {...props} /> },
  { href: '/analytics', label: 'Relatórios', icon: (props) => <BarChart3 {...props} /> },
  { href: '/settings', label: 'Configurações', icon: (props) => <Settings {...props} /> },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { tenant } = useAuthStore()

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sidebar-primary rounded-lg">
            <Building className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sidebar-foreground text-sm leading-none">
              {tenant?.name ?? 'ImoBI'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">Plataforma Imobiliária</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}

