export interface AIChatResponse {
  message: string
  intent:
    | 'property_inquiry'
    | 'schedule_visit'
    | 'price_negotiation'
    | 'general_info'
    | 'support'
    | 'spam'
    | 'other'
  actions: AIAction[]
  shouldHandoff: boolean
  handoffReason?: string
  leadDataExtracted: Partial<{
    fullName: string
    email: string
    phone: string
    transactionType: 'sale' | 'rent'
    propertyType: string
    neighborhood: string
    minPrice: number
    maxPrice: number
    bedrooms: number
    timeline: string // urgency
  }>
  confidence: number // 0-1
}

export interface AIAction {
  type:
    | 'update_lead_stage'
    | 'set_lead_score'
    | 'assign_agent'
    | 'schedule_activity'
    | 'send_property'
    | 'create_deal'
    | 'update_contact_field'
  payload: Record<string, unknown>
}

export interface AILeadScore {
  score: number // 0-100
  factors: Array<{ label: string; impact: number; description: string }>
  recommendation: string
}

export interface AIPropertyDescription {
  title: string
  description: string
  highlights: string[]
  seoKeywords: string[]
  metaDescription: string
}
