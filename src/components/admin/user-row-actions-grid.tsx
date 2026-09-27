// ============================================
// Zar30 - User Row Actions (Per-Row) — همیشه نمایان
// ============================================
// همه ۲۱ اقدام مدیریتی — ۷ دکمه در هر ردیف (۳ ردیف)
// بدون کادر/حاشیه دور گروه — دکمه‌ها آزاد و هم‌اندازه
// permission gate سمت کلاینت (نمایش) — enforce همیشه سمت سرور
// ============================================

'use client'

import Link from 'next/link'
import {
  IconArrowsLeftRight,
  IconBan,
  IconBuildingBank,
  IconCalendarClock,
  IconCircleKey,
  IconCoin,
  IconCreditCard,
  IconDiscount,
  IconIdBadge2,
  IconMail,
  IconPencil,
  IconRefresh,
  IconShieldExclamation,
  IconShoppingCart,
  IconStack2,
  IconTrendingUp,
  IconUser,
  IconUsersGroup,
  IconWallet,
} from '@tabler/icons-react'
import { hasPermission, PERMISSIONS, type Permission } from '@/lib/auth/rbac'
import { cn } from 'cn'

export interface UserRowAction {
  key: string
  label: string
  href: (userId: string) => string
  icon: React.ComponentType<{ className?: string; stroke?: number | string }>
  permission?: Permission
  tone?: 'default' | 'danger' | 'gold'
}

/** همه اقدامات هر کاربر — ۷ ستون × ۳ ردیف، همیشه زیر ردیف نمایش داده می‌شود */
export const USER_ROW_ACTIONS: readonly UserRowAction[] = [
  {
    key: 'edit',
    label: 'ویرایش',
    href: (id) => `/admin/users/${id}/edit`,
    icon: IconPencil,
    permission: PERMISSIONS.USERS_UPDATE,
  },
  {
    key: 'bank',
    label: 'کارت و شبا',
    href: (id) => `/admin/users/${id}/bank-accounts`,
    icon: IconBuildingBank,
    permission: PERMISSIONS.BANK_ACCOUNTS_READ,
  },
  {
    key: 'kyc',
    label: 'احراز هویت',
    href: (id) => `/admin/users/${id}/kyc`,
    icon: IconIdBadge2,
    permission: PERMISSIONS.KYC_READ,
  },
  {
    key: 'orders',
    label: 'سفارشات',
    href: (id) => `/admin/users/${id}/orders`,
    icon: IconShoppingCart,
    permission: PERMISSIONS.ORDERS_READ,
  },
  {
    key: 'wallet-gold',
    label: 'کیف طلایی',
    href: (id) => `/admin/users/${id}/wallet`,
    icon: IconCoin,
    permission: PERMISSIONS.WALLETS_READ,
  },
  {
    key: 'wallet-toman',
    label: 'کیف تومانی',
    href: (id) => `/admin/users/${id}/wallet`,
    icon: IconWallet,
    permission: PERMISSIONS.WALLETS_READ,
  },
  {
    key: 'sync',
    label: 'همگام‌سازی',
    href: (id) => `/admin/users/${id}/sync`,
    icon: IconRefresh,
    permission: PERMISSIONS.WALLETS_FREEZE,
    tone: 'gold',
  },

  {
    key: 'transfers',
    label: 'انتقال‌ها',
    href: (id) => `/admin/users/${id}/transfers`,
    icon: IconArrowsLeftRight,
    permission: PERMISSIONS.TRANSFERS_READ,
  },
  {
    key: 'payments',
    label: 'درگاه',
    href: (id) => `/admin/users/${id}/payments`,
    icon: IconCreditCard,
    permission: PERMISSIONS.PAYMENTS_READ,
  },
  {
    key: 'transactions',
    label: 'تراکنش مالی',
    href: (id) => `/admin/users/${id}/transactions`,
    icon: IconWallet,
    permission: PERMISSIONS.TRANSACTIONS_READ,
  },
  {
    key: 'deliveries',
    label: 'تحویل فیزیکی',
    href: (id) => `/admin/users/${id}/deliveries`,
    icon: IconShoppingCart,
    permission: PERMISSIONS.DELIVERY_READ,
  },
  {
    key: 'installments',
    label: 'قسطی',
    href: (id) => `/admin/users/${id}/installments`,
    icon: IconCalendarClock,
    permission: PERMISSIONS.INSTALLMENTS_READ,
  },
  {
    key: 'investments',
    label: 'زرکار',
    href: (id) => `/admin/users/${id}/investments`,
    icon: IconTrendingUp,
    permission: PERMISSIONS.INVESTMENTS_READ,
  },
  {
    key: 'referrals',
    label: 'دعوت دوستان',
    href: (id) => `/admin/users/${id}/referrals`,
    icon: IconUsersGroup,
    permission: PERMISSIONS.REFERRALS_READ,
  },

  {
    key: 'fees',
    label: 'کارمزد',
    href: (id) => `/admin/users/${id}/fees`,
    icon: IconDiscount,
    permission: PERMISSIONS.PRICING_READ,
  },
  {
    key: 'level',
    label: 'تغییر سطح',
    href: (id) => `/admin/users/${id}/level`,
    icon: IconStack2,
    permission: PERMISSIONS.KYC_APPROVE,
  },
  {
    key: 'message',
    label: 'ارسال پیامک',
    href: (id) => `/admin/users/${id}/message`,
    icon: IconMail,
    permission: PERMISSIONS.NOTIFICATIONS_SEND,
  },
  {
    key: 'risk',
    label: 'مشکوک',
    href: (id) => `/admin/users/${id}/risk`,
    icon: IconShieldExclamation,
    permission: PERMISSIONS.RISK_READ,
  },
  {
    key: 'credit',
    label: 'اعتبارها',
    href: (id) => `/admin/users/${id}/credit`,
    icon: IconUser,
    permission: PERMISSIONS.RISK_REVIEW,
  },
  {
    key: 'sessions',
    label: 'نشست‌ها',
    href: (id) => `/admin/users/${id}/sessions`,
    icon: IconCircleKey,
    permission: PERMISSIONS.SECURITY_READ,
  },
  {
    key: 'block',
    label: 'مسدود/فعال',
    href: (id) => `/admin/users/${id}/block`,
    icon: IconBan,
    permission: PERMISSIONS.USERS_STATUS,
    tone: 'danger',
  },
] as const

/**
 * گرید ۷ ستونه — همه دکمه‌ها آزاد (بدون کادر دور گروه)
 */
export function UserRowActionsGrid({
  userId,
  permissions,
}: {
  userId: string
  permissions: readonly Permission[]
}) {
  const visible = USER_ROW_ACTIONS.filter(
    (a) => !a.permission || hasPermission(permissions, a.permission),
  )

  return (
    <div role="group" aria-label="اقدامات مدیریتی کاربر" className="grid grid-cols-7 gap-1">
      {visible.map((a) => (
        <RowActionLink key={a.key} action={a} userId={userId} />
      ))}
    </div>
  )
}

function RowActionLink({ action, userId }: { action: UserRowAction; userId: string }) {
  const Icon = action.icon
  return (
    <Link
      href={action.href(userId)}
      onClick={(e) => e.stopPropagation()}
      title={action.label}
      className={cn(
        'border-border/60 focus-visible:ring-ring inline-flex h-7 w-full items-center justify-center gap-1 rounded-md border text-[9.5px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none',
        action.tone === 'danger'
          ? 'border-error/30 text-error hover:bg-error/10'
          : action.tone === 'gold'
            ? 'border-gold-500/40 text-gold-700 dark:text-gold-400 hover:bg-gold-500/10'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="size-3 shrink-0" stroke={1.75} aria-hidden="true" />
      <span className="truncate">{action.label}</span>
    </Link>
  )
}
