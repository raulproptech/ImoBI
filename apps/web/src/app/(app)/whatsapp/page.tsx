'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Send, MessageCircle, Bot, Phone, Paperclip, Mic } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function WhatsAppPage() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'cliente',
      text: 'Bom dia! Tenho interesse no apartamento Petrópolis.',
      time: '09:32',
      type: 'received',
    },
    {
      id: '2',
      sender: 'Eu',
      text: 'Bom dia! Perfeito. Posso agendar uma visita para você?',
      time: '09:34',
      type: 'sent',
    },
  ] as any[])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      sender: 'Eu',
      text: input,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'sent' as const,
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Mock AI typing
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'IA ImoBI',
        text: 'Perfeito! Baseado no seu interesse, tenho 3 opções similares. Qual melhor horário para visita?',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: 'received' as const,
      }
      setMessages(prev => [...prev, aiMessage])
    }, 1500)
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b bg-muted/50">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
          <Phone className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold">Maria Santos</h2>
          <p className="text-sm text-muted-foreground">Online</p>
        </div>
        <Button variant="ghost" size="sm" className="ml-auto h-8 w-8 p-0">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Mic className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.type === 'sent' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm shadow',
                message.type === 'sent'
                  ? 'bg-green-500 text-white rounded-br-sm'
                  : 'bg-muted rounded-bl-sm'
              )}
            >
              <p>{message.text}</p>
              <p className="text-xs opacity-75 mt-1">{message.time}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-sm max-w-xs">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-background p-4">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-12 w-12 p-0">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Digite sua mensagem..."
            className="flex-1 min-h-[44px] px-4 py-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          />
          <Button 
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="h-12 px-6"
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
          <Button variant="ghost" size="sm" className="h-8 px-3 py-1">
            <Bot className="h-3 w-3 mr-1" />
            IA Resposta
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-3 py-1">
            Template
          </Button>
        </div>
      </div>
    </div>
  )
}

