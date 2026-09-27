// ============================================
// Zar30 - User Actions Menu (Per-Row)
// ============================================
// منوی اکشن‌های ریز مدیریتی برای هر کاربر در جدول
// هر دکمه → زیرصفحه اختصاصی /admin/users/[id]/<section>
// permission gate سمت کلاینت (نمایش) — enforce همیشه سمت سرور
// ============================================

'use client'

import { useEffect, useRef, useState } from 'react'
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
  IconMapPin,
  IconPackage,
  IconPencil,
  IconRefresh,
  IconShieldExclamation,
  IconShoppingCart,
  IconStack2,
  IconTrendingUp,
  IconUser,
  IconUserOff,
  IconUsersGroup,
  IconWallet,
  IconDotsVertical,
} from '@tabler/icons-react'
import { hasPermission, PERMISSIONS, type Permission } from '@/lib/auth/rbac'
import { cn } from 'cn'

export interface UserActionDef {
  key: string
  label: string
  href: (userId: string) => string
  icon: React.ComponentType<{ className?: string; stroke?: number | string }>
  permission?: Permission
  tone?: 'default' | 'danger' | 'gold'
  /** گروه منوی کلیک‌راست‌مانند */
  group: 'identity' | 'finance' | 'ops' | 'control'
}

export const USER_ACTIONS: readonly UserActionDef[] = [
  // ---------- identity ----------
  {
    key: 'edit',
    label: 'ویرایش مشخصات',
    href: (id) => `/admin/users/${id}/edit`,
    icon: IconPencil,
    permission: PERMISSIONS.USERS_UPDATE,
    group: 'identity',
  },
  {
    key: 'bank',
    label: 'کارت و شبا',
    href: (id) => `/admin/users/${id}/bank-accounts`,
    icon: IconBuildingBank,
    permission: PERMISSIONS.BANK_ACCOUNTS_READ,
    group: 'identity',
  },
  {
    key: 'kyc',
    label: 'احراز هویت',
    href: (id) => `/admin/users/${id}/kyc`,
    icon: IconIdBadge2,
    permission: PERMISSIONS.KYC_READ,
    group: 'identity',
  },
  {
    key: 'level',
    label: 'تغییر سطح',
    href: (id) => `/admin/users/${id}/level`,
    icon: IconStack2,
    permission: PERMISSIONS.KYC_APPROVE,
    group: 'identity',
  },
  {
    key: 'sessions',
    label: 'نشست‌ها',
    href: (id) => `/admin/users/${id}/sessions`,
    icon: IconCircleKey,
    permission: PERMISSIONS.SECURITY_READ,
    group: 'identity',
  },
  // ---------- finance ----------
  {
    key: 'wallet-gold',
    label: 'کیف پول طلایی',
    href: (id) => `/admin/users/${id}/wallet`,
    icon: IconCoin,
    permission: PERMISSIONS.WALLETS_READ,
    group: 'finance',
  },
  {
    key: 'wallet-toman',
    label: 'کیف پول تومانی',
    href: (id) => `/admin/users/${id}/wallet`,
    icon: IconWallet,
    permission: PERMISSIONS.WALLETS_READ,
    group: 'finance',
  },
  {
    key: 'orders',
    label: 'سفارشات',
    href: (id) => `/admin/users/${id}/orders`,
    icon: IconShoppingCart,
    permission: PERMISSIONS.ORDERS_READ,
    group: 'finance',
  },
  {
    key: 'sync',
    label: 'همگام‌سازی سفارشات',
    href: (id) => `/admin/users/${id}/sync`,
    icon: IconRefresh,
    permission: PERMISSIONS.WALLETS_FREEZE,
    group: 'finance',
    tone: 'gold',
  },
  {
    key: 'transfers',
    label: 'انتقال‌ها',
    href: (id) => `/admin/users/${id}/transfers`,
    icon: IconArrowsLeftRight,
    permission: PERMISSIONS.TRANSFERS_READ,
    group: 'finance',
  },
  {
    key: 'payments',
    label: 'تراکنش‌های درگاه',
    href: (id) => `/admin/users/${id}/payments`,
    icon: IconCreditCard,
    permission: PERMISSIONS.PAYMENTS_READ,
    group: 'finance',
  },
  {
    key: 'transactions',
    label: 'تراکنش‌های مالی',
    href: (id) => `/admin/users/${id}/transactions`,
    icon: IconWallet,
    permission: PERMISSIONS.TRANSACTIONS_READ,
    group: 'finance',
  },
  {
    key: 'fees',
    label: 'کارمزد',
    href: (id) => `/admin/users/${id}/fees`,
    icon: IconDiscount,
    permission: PERMISSIONS.PRICING_READ,
    group: 'finance',
  },
  // ---------- ops ----------
  {
    key: 'deliveries',
    label: 'تحویل فیزیکی',
    href: (id) => `/admin/users/${id}/deliveries`,
    icon: IconPackage,
    permission: PERMISSIONS.DELIVERY_READ,
    group: 'ops',
  },
  {
    key: 'installments',
    label: 'قسطی',
    href: (id) => `/admin/users/${id}/installments`,
    icon: IconCalendarClock,
    permission: PERMISSIONS.INSTALLMENTS_READ,
    group: 'ops',
  },
  {
    key: 'investments',
    label: 'زرکار (سرمایه‌گذاری)',
    href: (id) => `/admin/users/${id}/investments`,
    icon: IconTrendingUp,
    permission: PERMISSIONS.INVESTMENTS_READ,
    group: 'ops',
  },
  {
    key: 'referrals',
    label: 'دعوت دوستان',
    href: (id) => `/admin/users/${id}/referrals`,
    icon: IconUsersGroup,
    permission: PERMISSIONS.REFERRALS_READ,
    group: 'ops',
  },
  {
    key: 'message',
    label: 'ارسال پیامک',
    href: (id) => `/admin/users/${id}/message`,
    icon: IconMail,
    permission: PERMISSIONS.NOTIFICATIONS_SEND,
    group: 'ops',
  },
  // ---------- control ----------
  {
    key: 'risk',
    label: 'مشکوک (ریسک)',
    href: (id) => `/admin/users/${id}/risk`,
    icon: IconShieldExclamation,
    permission: PERMISSIONS.RISK_READ,
    group: 'control',
  },
  {
    key: 'credit',
    label: 'اعتبارها',
    href: (id) => `/admin/users/${id}/credit`,
    icon: IconUser,
    permission: PERMISSIONS.RISK_REVIEW,
    group: 'control',
  },
  {
    key: 'block',
    label: 'مسدود / فعال‌سازی',
    href: (id) => `/admin/users/${id}/block`,
    icon: IconBan,
    permission: PERMISSIONS.USERS_STATUS,
    group: 'control',
    tone: 'danger',
  },
] as const

const GROUP_LABELS: Record<UserActionDef['group'], string> = {
  identity: 'هویت و دسترسی',
  finance: 'مالی و کیف پول',
  ops: 'عملیات و خدمات',
  control: 'کنترل و ریسک',
}

export function UserActionsButton({
  userId,
  permissions,
  userName,
}: {
  userId: string
  permissions: readonly Permission[]
  userName: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const visible = USER_ACTIONS.filter(
    (a) => !a.permission || hasPermission(permissions, a.permission),
  )

  const groups = (['identity', 'finance', 'ops', 'control'] as const)
    .map((g) => ({ group: g, items: visible.filter((a) => a.group === g) }))
    .filter((g) => g.items.length > 0)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`اقدامات مدیریتی ${userName}`}
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-lg border transition-colors',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
          open
            ? 'border-gold-500/50 bg-gold-500/10 text-gold-700 dark:text-gold-400'
            : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <IconDotsVertical className="size-4" stroke={1.75} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={`اقدامات ${userName}`}
          className="bg-card border-border/60 absolute top-full left-0 z-40 mt-1 max-h-[70vh] w-64 overflow-y-auto rounded-xl border p-1.5 shadow-lg"
        >
          {groups.map(({ group, items }) => (
            <div key={group} className="mb-1 last:mb-0">
              <p className="text-muted-foreground/70 px-2 py-1 text-[10px] font-semibold">
                {GROUP_LABELS[group]}
              </p>
              {items.map((a) => {
                const Icon = a.icon
                return (
                  <Link
                    key={a.key}
                    href={a.href(userId)}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-colors',
                      a.tone === 'danger'
                        ? 'text-error hover:bg-error/10'
                        : a.tone === 'gold'
                          ? 'text-gold-700 dark:text-gold-400 hover:bg-gold-500/10'
                          : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-70" stroke={1.75} />
                    {a.label}
                  </Link>
                )
              })}
            </div>
          ))}
          <Link
            href={`/admin/users/${userId}`}
            className="border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground mt-1 flex items-center gap-2.5 border-t px-2 pt-2 pb-1 text-xs transition-colors"
          >
            <IconUserOff className="size-4 shrink-0 opacity-70" stroke={1.75} />
            پروفایل کامل کاربر
          </Link>
        </div>
      )}
    </div>
  )
}

// سریع‌اکشن‌های inline — بدون منو، مستقیم روی ردیف
export function UserQuickActions({
  userId,
  permissions,
}: {
  userId: string
  permissions: readonly Permission[]
}) {
  const quick: {
    label: string
    href: string
    icon: React.ComponentType<{ className?: string; stroke?: number | string }>
    permission?: Permission
  }[] = [
    {
      label: 'ویرایش',
      href: `/admin/users/${userId}/edit`,
      icon: IconPencil,
      permission: PERMISSIONS.USERS_UPDATE,
    },
    {
      label: 'کیف پول',
      href: `/admin/users/${userId}/wallet`,
      icon: IconCoin,
      permission: PERMISSIONS.WALLETS_READ,
    },
    {
      label: 'سفارشات',
      href: `/admin/users/${userId}/orders`,
      icon: IconShoppingCart,
      permission: PERMISSIONS.ORDERS_READ,
    },
    {
      label: 'احراز',
      href: `/admin/users/${userId}/kyc`,
      icon: IconIdBadge2,
      permission: PERMISSIONS.KYC_READ,
    },
    {
      label: 'مسدودسازی',
      href: `/admin/users/${userId}/block`,
      icon: IconMapPin,
      permission: PERMISSIONS.USERS_STATUS,
    },
  ]
  const visible = quick.filter((q) => !q.permission || hasPermission(permissions, q.permission))
  // آیکون مسدودسازی باید Ban باشد نه MapPin
  const normalized = visible.map((q) => (q.label === 'مسدودسازی' ? { ...q, icon: IconBan } : q))
  return (
    <div className="flex items-center gap-0.5">
      {normalized.map((q) => {
        const Icon = q.icon
        return (
          <Link
            key={q.label}
            href={q.href}
            title={q.label}
            aria-label={q.label}
            className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-7 items-center justify-center rounded-md transition-colors"
          >
            <Icon className="size-3.5" stroke={1.75} />
          </Link>
        )
      })}
    </div>
  )
}
