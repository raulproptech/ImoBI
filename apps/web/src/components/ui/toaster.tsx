'use client'
import { useToast } from '@/hooks/use-toast'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-background animate-in slide-in-from-bottom-2',
            toast.variant === 'destructive' && 'border-destructive bg-destructive text-destructive-foreground'
          )}
        >
          <div className="flex-1">
            {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
            {toast.description && <p className="text-sm text-muted-foreground">{toast.description}</p>}
          </div>
          <button onClick={() => dismiss(toast.id)} className="opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
