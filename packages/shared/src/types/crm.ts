export type LeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'visit_scheduled'
  | 'visited'
  | 'proposal_sent'
  | 'negotiating'
  | 'won'
  | 'lost'

export interface PipelineBoard {
  id: string
  name: string
  stages: PipelineBoardStage[]
}

export interface PipelineBoardStage {
  id: string
  name: string
  color: string
  position: number
  deals: BoardDeal[]
  totalValue: number
  totalDeals: number
}

export interface BoardDeal {
  id: string
  title: string
  value?: number
  contact: {
    id: string
    fullName: string
    avatarUrl?: string
    phoneWhatsapp?: string
  }
  assignedAgent?: {
    id: string
    fullName: string
    avatarUrl?: string
  }
  daysInStage: number
  lastActivityAt?: string
}
