// ============================================
// Zar30 - User Subpage Wrapper (Shared) — v2
// ============================================
// قاب مشترک زیرصفحه‌ها: کارت اطلاعات کامل + ناوبری عمودی کنار محتوا
// دسکتاپ: دو ستونه (ناوبری + محتوا) — موبایل: زیر هم
// ============================================

'use client'

import type { ReactNode } from 'react'
import { useParams } from 'next/navigation'
import {
  UserDetailHeader,
  UserSectionNav,
  USER_SECTION_TABS,
} from '@/components/admin/user-detail-header'

export function UserSubpage({
  path,
  children,
}: {
  /** مسیر فعال — برای highlight ناوبری */
  path: string
  children: ReactNode
}) {
  const { id } = useParams<{ id: string }>()
  return (
    <div>
      <UserDetailHeader userId={id} />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        {/* ناوبری عمودی — همه بخش‌ها زیر هم */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <UserSectionNav userId={id} activePath={path} tabs={[...USER_SECTION_TABS]} />
        </aside>
        {/* محتوا */}
        <div className="min-w-0 space-y-4">{children}</div>
      </div>
    </div>
  )
}
