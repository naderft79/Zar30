// ============================================
// Zar30 - Price Service Types
// ============================================
// اینترفیس سرویس قیمت طلا
// در Phase 5 به Provider واقعی متصل می شود
// ============================================

export interface GoldPrice {
  /** قیمت هر گرم طلای ۱۸ عیار به ریال */
  buyPrice: number
  /** قیمت فروش هر گرم به ریال */
  sellPrice: number
  /** زمان به‌روزرسانی (ISO) */
  updatedAt: string
  /** آیا داده واقعی بازار است یا نمایشی */
  isLive: boolean
  /** منبع قیمت */
  source: string
}

export interface PriceService {
  getCurrentPrice(): Promise<GoldPrice>
}
