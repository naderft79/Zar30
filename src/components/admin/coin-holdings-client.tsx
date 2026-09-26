// ============================================
// Zar30 - Admin Coin Holdings Client
// ============================================
// موجودی سکه/شمش کاربران — read-only با فیلتر محصول و جستجوی کاربر
// ============================================

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiGetWithRefresh } from '@/lib/api/client'
import { formatGoldGrams } from '@/lib/utils/format'
import { AdminFinanceList } from '@/components/admin/finance-list'

interface HoldingRow {
  id: string
  quantity: number
  journalEntryId: string | null
  createdAt: string
  updatedAt: string
  product: { id: string; code: string; name: string; kind: string; weightGrams: string }
  user: { id: string; mobile: string; name: string }
}

export function AdminCoinHoldingsClient() {
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])

  // گزینه‌های محصول برای فیلتر — در اولین پاسخ لیست می‌آیند
  useEffect(() => {
    void (async () => {
      const res = await apiGetWithRefresh<{
        holdings: unknown[]
        productOptions?: { id: string; name: string }[]
      }>('/api/v1/admin/coin-holdings?limit=1')
      if (res.ok && res.data?.productOptions) setProducts(res.data.productOptions)
    })()
  }, [])

  return (
    <AdminFinanceList<HoldingRow>
      title="موجودی سکه و شمش کاربران"
      description="موجودی فیزیکی ثبت‌شده هر کاربر به تفکیک محصول — read-only"
      endpoint="/api/v1/admin/coin-holdings"
      dataKey="holdings"
      keyOf={(h) => h.id}
      searchPlaceholder="کاربر یا محصول…"
      dateRange
      filters={[
        {
          key: 'productId',
          label: 'محصول',
          options: products.map((p) => ({ value: p.id, label: p.name })),
        },
      ]}
      columns={[
        {
          key: 'user',
          header: 'کاربر',
          render: (h) => (
            <Link href={`/admin/users/${h.user.id}`} className="font-medium hover:underline">
              {h.user.name}
            </Link>
          ),
        },
        {
          key: 'mobile',
          header: 'موبایل',
          render: (h) => <span dir="ltr">{h.user.mobile}</span>,
          mobile: false,
        },
        { key: 'product', header: 'محصول', render: (h) => h.product.name },
        {
          key: 'weight',
          header: 'وزن واحد',
          render: (h) => formatGoldGrams(h.product.weightGrams),
          mobile: false,
        },
        {
          key: 'qty',
          header: 'تعداد',
          render: (h) => <span className="font-bold tabular-nums">{h.quantity}</span>,
        },
        {
          key: 'total',
          header: 'وزن کل',
          render: (h) => formatGoldGrams(String(Number(h.product.weightGrams) * h.quantity)),
          mobile: false,
        },
        {
          key: 'updated',
          header: 'آخرین تغییر',
          render: (h) => new Date(h.updatedAt).toLocaleDateString('fa-IR'),
        },
      ]}
      emptyMessage="موجودی سکه‌ای یافت نشد"
    />
  )
}
