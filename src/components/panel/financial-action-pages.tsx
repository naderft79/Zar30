// ============================================
// Zar30 - Financial Action Pages
// ============================================
// صفحات تمام‌صفحه عملیات مالی — واریز، برداشت، انتقال، تحویل
// طراحی هم‌سبک صورتحساب قسطی: بدون هدر، لینک بازگشت، کارت متمرکز
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconArrowRight,
  IconCashBanknote,
  IconCashBanknotePlus,
  IconTransfer,
  IconTruckDelivery,
} from '@tabler/icons-react'
import { Card, CardContent } from '@/components/ui/card'
import { apiGetWithRefresh } from '@/lib/api/client'
import { useOnlineStatus } from './offline-indicator'
import { DepositSheet } from './deposit-sheet'
import { WithdrawSheet } from './withdraw-sheet'
import { TransferSheet } from './transfer-sheet'
import { DeliverySheet } from './delivery-sheet'
import type { BankAccountRow } from './bank-cards'
import type { ComponentType, ReactNode } from 'react'

function ActionShell({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: ComponentType<{ className?: string; stroke?: number }>
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="animate-stagger mx-auto max-w-xl space-y-5">
      <Link
        href="/dashboard/assets"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <IconArrowRight className="size-4" stroke={1.75} />
        بازگشت به دارایی‌ها
      </Link>

      {/* عنوان — مثل صورتحساب: مقدار بزرگ، لیبل کوچک */}
      <div className="py-2 text-center">
        <p className="text-foreground inline-flex items-center justify-center gap-2 text-3xl font-extrabold">
          <Icon className="text-gold-600 size-7" stroke={1.75} />
          {title}
        </p>
        <p className="text-muted-foreground mt-2.5 text-[11px]">{subtitle}</p>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">{children}</CardContent>
      </Card>
    </div>
  )
}

function useBackToAssets() {
  const router = useRouter()
  return () => router.push('/dashboard/assets')
}

export function DepositPageClient() {
  const online = useOnlineStatus()
  const back = useBackToAssets()
  return (
    <ActionShell
      icon={IconCashBanknotePlus}
      title="واریز به کیف پول"
      subtitle="از طریق درگاه پرداخت یا کارت‌به‌کارت"
    >
      <DepositSheet open inline onClose={back} online={online} onCompleted={() => {}} />
    </ActionShell>
  )
}

export function WithdrawPageClient() {
  const online = useOnlineStatus()
  const back = useBackToAssets()
  const [accounts, setAccounts] = useState<BankAccountRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await apiGetWithRefresh<{ accounts: BankAccountRow[] }>('/api/v1/bank-accounts')
      if (!cancelled && res.ok) setAccounts(res.data?.accounts ?? [])
      if (!cancelled && !res.ok) setAccounts([])
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ActionShell
      icon={IconCashBanknote}
      title="درخواست برداشت"
      subtitle="تسویه تومان به حساب بانکی شما"
    >
      {accounts === null ? (
        <div className="skeleton-shimmer h-40 rounded-xl" />
      ) : (
        <WithdrawSheet
          open
          inline
          onClose={back}
          online={online}
          accounts={accounts}
          onCompleted={() => {}}
        />
      )}
    </ActionShell>
  )
}

export function TransferPageClient() {
  const online = useOnlineStatus()
  const back = useBackToAssets()
  return (
    <ActionShell
      icon={IconTransfer}
      title="انتقال به کاربر زرسی"
      subtitle="ارسال طلا یا تومان — با امکان هدیه دادن"
    >
      <TransferSheet open inline onClose={back} online={online} onCompleted={() => {}} />
    </ActionShell>
  )
}

export function DeliveryPageClient() {
  const online = useOnlineStatus()
  const back = useBackToAssets()
  return (
    <ActionShell
      icon={IconTruckDelivery}
      title="تحویل فیزیکی طلا"
      subtitle="طلای آب‌شده، سکه و شمش — پستی یا حضوری"
    >
      <DeliverySheet open inline onClose={back} online={online} onCompleted={() => {}} />
    </ActionShell>
  )
}
