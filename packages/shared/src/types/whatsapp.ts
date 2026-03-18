export interface WAInboundMessage {
  object: string
  entry: WAEntry[]
}

export interface WAEntry {
  id: string
  changes: WAChange[]
}

export interface WAChange {
  value: WAValue
  field: string
}

export interface WAValue {
  messaging_product: string
  metadata: {
    display_phone_number: string
    phone_number_id: string
  }
  contacts?: WAContact[]
  messages?: WAMessage[]
  statuses?: WAStatus[]
}

export interface WAContact {
  profile: { name: string }
  wa_id: string
}

export interface WAMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'interactive'
  text?: { body: string }
  image?: { id: string; mime_type: string; sha256: string; caption?: string }
  document?: { id: string; filename: string; mime_type: string }
  audio?: { id: string; mime_type: string }
  location?: { latitude: number; longitude: number; name?: string; address?: string }
  interactive?: {
    type: 'button_reply' | 'list_reply'
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string; description?: string }
  }
}

export interface WAStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  errors?: Array<{ code: number; title: string }>
}
