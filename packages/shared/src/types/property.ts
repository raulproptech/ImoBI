export interface PropertySearchFilters {
  transactionType?: 'sale' | 'rent' | 'both' | 'launch'
  propertyTypeIds?: string[]
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  minBedrooms?: number
  maxBedrooms?: number
  neighborhoods?: string[]
  cities?: string[]
  states?: string[]
  features?: string[]
  radiusKm?: number
  centerLat?: number
  centerLng?: number
  status?: string[]
  agentId?: string
  page?: number
  pageSize?: number
  sortBy?: 'price_asc' | 'price_desc' | 'area_asc' | 'newest' | 'oldest'
}

export interface PropertyListItem {
  id: string
  code: string
  title: string
  transactionType: string
  status: string
  priceSale?: number
  priceRent?: number
  areaUseful?: number
  bedrooms?: number
  bathrooms?: number
  parkingSpots?: number
  addressNeighborhood?: string
  addressCity?: string
  coverImageUrl?: string
  assignedAgent?: {
    id: string
    fullName: string
  }
  createdAt: string
  publishedAt?: string
  viewCount: number
  inquiryCount: number
}
