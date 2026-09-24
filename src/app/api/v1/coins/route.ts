// ============================================
// Zar30 - /api/v1/coins
// ============================================
// GET → محصولات سکه/شمش با قیمت لحظه‌ای + دارایی‌های کاربر
//       قیمت در دسترس نبود → unitPriceToman=null (state unavailable)
// ============================================

import { ok, withErrorHandler } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/guard'
import { getExecutablePrice } from '@/lib/finance/pricing.service'
import { listCoinProducts, listUserCoinHoldings } from '@/lib/finance/coin.service'

export const GET = withErrorHandler(async (req: Request) => {
  const auth = await requireAuth(req)

  // قیمت ممکن است در دسترس نباشد — صفحه همچنان محصول/دارایی را نشان می‌دهد
  let sellPrice: bigint | null = null
  try {
    sellPrice = (await getExecutablePrice()).sellPrice
  } catch {
    sellPrice = null
  }

  const [products, holdings] = await Promise.all([
    listCoinProducts(sellPrice),
    listUserCoinHoldings(auth.userId, sellPrice),
  ])
  return ok({ products, holdings, priceAvailable: sellPrice != null })
})
