// ============================================
// Zar30 - Gold Price Provider Abstraction
// ============================================
// خروجی Provider همیشه تومان است — اگر API خارجی واحد دیگری
// داشته باشد، adapter همان provider آن را به تومان normalize می‌کند.
// هیچ مفهوم واحد خارجی وارد Financial Core نمی‌شود.
// ============================================

export interface GoldPriceQuote {
  /** قیمت خرید هر گرم طلای ۱۸ عیار — تومان */
  buyPrice: bigint
  /** قیمت فروش هر گرم — تومان */
  sellPrice: bigint
  /** قیمت خام بازار — تومان (اختیاری؛ پیش‌فرض = sellPrice) */
  rawPrice?: bigint
  /** زمان ثبت قیمت در منبع */
  timestamp: Date
}

export interface GoldPriceProvider {
  readonly name: string
  fetchPrice(): Promise<GoldPriceQuote>
}
