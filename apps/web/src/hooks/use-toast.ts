import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastState: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

function emit(toasts: Toast[]) {
  toastState = toasts
  listeners.forEach(l => l(toasts))
}

export function toast(opts: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  emit([...toastState, { ...opts, id }])
  setTimeout(() => emit(toastState.filter(t => t.id !== id)), 5000)
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastState)

  const subscribe = useCallback(() => {
    const listener = (t: Toast[]) => setToasts([...t])
    listeners.push(listener)
    return () => { listeners = listeners.filter(l => l !== listener) }
  }, [])

  useState(subscribe)

  return {
    toasts,
    toast,
    dismiss: (id: string) => emit(toastState.filter(t => t.id !== id)),
  }
}
