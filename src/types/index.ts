// ============================================
// Zar30 - Shared Types
// ============================================
// انواع مشترک بین Web و Mobile (Capacitor)
// ============================================

// API Response Envelope
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export interface ApiErrorResponse {
  success: false
  error: {
    type: string
    title: string
    status: number
    detail: string
    instance?: string
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// Auth Types (Web + Mobile)
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthUser {
  id: string
  mobile: string
  kycLevel: number
  status: string
}

// Asset Types
export type AssetType = 'RIAL' | 'GOLD' | 'SILVER'

// Ledger Types (Double-Entry)
export interface LedgerEntryInput {
  ledgerAccountId: string
  entryType: 'DEBIT' | 'CREDIT'
  amountGold?: number
  amountRial?: bigint
  assetAccountId?: string
}

export interface JournalEntryInput {
  referenceType?: string
  referenceId?: string
  description?: string
  entries: LedgerEntryInput[]
}
