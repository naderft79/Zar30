// ============================================
// Zar30 - Admin Navigation Source of Truth
// ============================================
// Sidebar/Desktop + Drawer/Mobile هر دو از همین config استفاده می‌کنند
// هر item فقط وقتی دیده می‌شود که permission متناظر resolve‌شده وجود داشته باشد
// API همیشه enforce می‌کند؛ این فقط presentation gate است
// ============================================

import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  BarChart3,
  Bell,
  CalendarClock,
  ClipboardList,
  Code2,
  Coins,
  FileText,
  Flag,
  Globe,
  HeartPulse,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  MonitorSmartphone,
  ScrollText,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { PERMISSIONS, type Permission } from '@/lib/auth/rbac'

export interface AdminNavItem {
  key: string
  label: string
  href: string
  icon: LucideIcon
  description: string
  /** حداقل یکی از این permissionها برای دیدن item لازم است */
  permissions: readonly Permission[]
}

export interface AdminNavSection {
  key: string
  label: string
  items: readonly AdminNavItem[]
}

export const ADMIN_HOME = '/admin/dashboard'

export const ADMIN_NAV_SECTIONS: readonly AdminNavSection[] = [
  {
    key: 'overview',
    label: 'نمای کلی',
    items: [
      {
        key: 'dashboard',
        label: 'داشبورد',
        href: ADMIN_HOME,
        icon: LayoutDashboard,
        description: 'نمای عملیاتی و شاخص‌های کلیدی',
        permissions: [PERMISSIONS.DASHBOARD_READ],
      },
    ],
  },
  {
    key: 'customers',
    label: 'مشتریان',
    items: [
      {
        key: 'users',
        label: 'کاربران',
        href: '/admin/users',
        icon: Users,
        description: 'مدیریت و جستجوی کاربران',
        permissions: [PERMISSIONS.USERS_READ],
      },
      {
        key: 'kyc',
        label: 'احراز هویت',
        href: '/admin/kyc',
        icon: UserCheck,
        description: 'صف بررسی و تصمیم KYC',
        permissions: [PERMISSIONS.KYC_READ],
      },
      {
        key: 'accounts',
        label: 'حساب‌ها',
        href: '/admin/accounts',
        icon: Landmark,
        description: 'حساب‌های دارایی و کیف پول',
        permissions: [PERMISSIONS.ACCOUNTS_READ],
      },
      {
        key: 'sessions',
        label: 'نشست‌ها',
        href: '/admin/security/sessions',
        icon: MonitorSmartphone,
        description: 'نشست‌های فعال کاربران',
        permissions: [PERMISSIONS.SECURITY_READ],
      },
    ],
  },
  {
    key: 'finance',
    label: 'مالی',
    items: [
      {
        key: 'wallets',
        label: 'کیف پول‌ها',
        href: '/admin/wallets',
        icon: Wallet,
        description: 'موجودی و وضعیت کیف پول‌ها',
        permissions: [PERMISSIONS.WALLETS_READ],
      },
      {
        key: 'gold',
        label: 'دارایی طلا',
        href: '/admin/gold',
        icon: Coins,
        description: 'موجودی و ذخایر طلا',
        permissions: [PERMISSIONS.GOLD_READ],
      },
      {
        key: 'orders',
        label: 'سفارش‌ها',
        href: '/admin/orders',
        icon: ClipboardList,
        description: 'سفارش‌های خرید و فروش',
        permissions: [PERMISSIONS.ORDERS_READ],
      },
      {
        key: 'transactions',
        label: 'تراکنش‌ها',
        href: '/admin/transactions',
        icon: ArrowLeftRight,
        description: 'تراکنش‌های مالی',
        permissions: [PERMISSIONS.TRANSACTIONS_READ],
      },
      {
        key: 'deposits',
        label: 'واریزها',
        href: '/admin/deposits',
        icon: ArrowDownToLine,
        description: 'واریزهای ریالی',
        permissions: [PERMISSIONS.DEPOSITS_READ],
      },
      {
        key: 'withdrawals',
        label: 'برداشت‌ها',
        href: '/admin/withdrawals',
        icon: ArrowUpFromLine,
        description: 'درخواست‌های برداشت',
        permissions: [PERMISSIONS.WITHDRAWALS_READ],
      },
      {
        key: 'pricing',
        label: 'قیمت‌گذاری',
        href: '/admin/pricing',
        icon: Tag,
        description: 'قیمت و اسپرد طلا',
        permissions: [PERMISSIONS.PRICING_READ],
      },
    ],
  },
  {
    key: 'products',
    label: 'محصولات',
    items: [
      {
        key: 'installments',
        label: 'خرید قسطی',
        href: '/admin/installments',
        icon: CalendarClock,
        description: 'قراردادهای قسطی',
        permissions: [PERMISSIONS.INSTALLMENTS_READ],
      },
      {
        key: 'investments',
        label: 'سرمایه‌گذاری',
        href: '/admin/investments',
        icon: TrendingUp,
        description: 'صندوق‌ها و موقعیت‌ها',
        permissions: [PERMISSIONS.INVESTMENTS_READ],
      },
      {
        key: 'referrals',
        label: 'معرفی',
        href: '/admin/referrals',
        icon: Share2,
        description: 'برنامه معرفی دوستان',
        permissions: [PERMISSIONS.REFERRALS_READ],
      },
    ],
  },
  {
    key: 'service',
    label: 'خدمات',
    items: [
      {
        key: 'support',
        label: 'پشتیبانی',
        href: '/admin/support',
        icon: LifeBuoy,
        description: 'تیکت‌های پشتیبانی',
        permissions: [PERMISSIONS.TICKETS_READ],
      },
      {
        key: 'notifications',
        label: 'اعلان‌ها',
        href: '/admin/notifications',
        icon: Bell,
        description: 'اعلان‌ها و قالب‌ها',
        permissions: [PERMISSIONS.NOTIFICATIONS_READ],
      },
    ],
  },
  {
    key: 'risk-security',
    label: 'ریسک و امنیت',
    items: [
      {
        key: 'risk',
        label: 'ریسک',
        href: '/admin/risk',
        icon: ShieldAlert,
        description: 'قوانین و هشدارهای ریسک',
        permissions: [PERMISSIONS.RISK_READ],
      },
      {
        key: 'fraud',
        label: 'تقلب',
        href: '/admin/fraud',
        icon: Activity,
        description: 'سیگنال‌ها و بررسی تقلب',
        permissions: [PERMISSIONS.FRAUD_READ],
      },
      {
        key: 'security',
        label: 'امنیت',
        href: '/admin/security',
        icon: ShieldCheck,
        description: 'رویدادها و سیاست‌های امنیتی',
        permissions: [PERMISSIONS.SECURITY_READ],
      },
      {
        key: 'audit-logs',
        label: 'لاگ ممیزی',
        href: '/admin/audit-logs',
        icon: ScrollText,
        description: 'رویدادهای ممیزی append-only',
        permissions: [PERMISSIONS.AUDIT_READ],
      },
    ],
  },
  {
    key: 'content-growth',
    label: 'محتوا و رشد',
    items: [
      {
        key: 'content',
        label: 'محتوا',
        href: '/admin/content',
        icon: FileText,
        description: 'محتوای CMS و صفحات',
        permissions: [PERMISSIONS.CONTENT_READ],
      },
      {
        key: 'seo',
        label: 'سئو',
        href: '/admin/seo',
        icon: Globe,
        description: 'متادیتا و سئو',
        permissions: [PERMISSIONS.SEO_READ],
      },
    ],
  },
  {
    key: 'intelligence',
    label: 'هوش و گزارش',
    items: [
      {
        key: 'reports',
        label: 'گزارش‌ها',
        href: '/admin/reports',
        icon: BarChart3,
        description: 'گزارش‌ها و خروجی‌ها',
        permissions: [PERMISSIONS.REPORTS_READ],
      },
    ],
  },
  {
    key: 'administration',
    label: 'مدیریت سیستم',
    items: [
      {
        key: 'team',
        label: 'تیم',
        href: '/admin/team',
        icon: UsersRound,
        description: 'اعضای تیم ادمین',
        permissions: [PERMISSIONS.TEAM_READ],
      },
      {
        key: 'roles',
        label: 'نقش‌ها و دسترسی‌ها',
        href: '/admin/team/roles',
        icon: KeyRound,
        description: 'نقش‌ها و permissionها',
        permissions: [PERMISSIONS.ROLES_READ],
      },
      {
        key: 'settings',
        label: 'تنظیمات',
        href: '/admin/settings',
        icon: Settings,
        description: 'تنظیمات پلتفرم',
        permissions: [PERMISSIONS.SETTINGS_READ],
      },
      {
        key: 'feature-flags',
        label: 'Feature Flags',
        href: '/admin/feature-flags',
        icon: Flag,
        description: 'پرچم‌های قابلیت',
        permissions: [PERMISSIONS.FLAGS_READ],
      },
      {
        key: 'api',
        label: 'API',
        href: '/admin/api',
        icon: Code2,
        description: 'کلیدها و webhookها',
        permissions: [PERMISSIONS.API_READ],
      },
      {
        key: 'system-health',
        label: 'سلامت سیستم',
        href: '/admin/system/health',
        icon: HeartPulse,
        description: 'وضعیت سرویس‌ها و زیرساخت',
        permissions: [PERMISSIONS.SYSTEM_READ],
      },
    ],
  },
]

// item فقط وقتی دیده می‌شود که حداقل یکی از permissionهایش resolve شده باشد
export function canSeeAdminItem(item: AdminNavItem, permissions: readonly Permission[]): boolean {
  return item.permissions.some((p) => permissions.includes(p))
}

// داشبورد exact؛ بقیه prefix — /admin/team روی /admin/team/roles هم active است
export function isAdminNavItemActive(item: AdminNavItem, pathname: string): boolean {
  if (item.href === ADMIN_HOME) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

const HOME_CRUMB = { label: 'مرکز عملیات', href: ADMIN_HOME } as const

// مسیر راهنما — خانه ادمین اول + طولانی‌ترین item منطبق + segment جزئیات
export function getAdminBreadcrumbs(pathname: string): readonly { label: string; href?: string }[] {
  // طولانی‌ترین href منطبق — برای /admin/team/roles ابتدا خود item پیدا می‌شود
  let matched: AdminNavItem | undefined
  for (const section of ADMIN_NAV_SECTIONS) {
    for (const item of section.items) {
      if (
        isAdminNavItemActive(item, pathname) &&
        (!matched || item.href.length > matched.href.length)
      ) {
        matched = item
      }
    }
  }

  if (!matched) return [HOME_CRUMB]
  if (matched.href === ADMIN_HOME && pathname === ADMIN_HOME) {
    return [{ label: HOME_CRUMB.label }]
  }

  const crumbs: { label: string; href?: string }[] = [HOME_CRUMB, { label: matched.label }]
  // segment اضافی (مثلاً detail page) — آخرین crumb قابل کلیک نیست
  const rest = pathname.slice(matched.href.length).replace(/^\//, '')
  if (rest) {
    const first = decodeURIComponent(rest.split('/')[0] ?? '')
    if (first) crumbs.push({ label: first })
  }
  return crumbs
}
