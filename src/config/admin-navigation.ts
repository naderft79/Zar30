// ============================================
// Zar30 - Admin Navigation Source of Truth
// ============================================
// Sidebar/Desktop + Drawer/Mobile هر دو از همین config استفاده می‌کنند
// هر section آیکون اختصاصی دارد؛ هر item فقط با permission متناظر دیده می‌شود
// API همیشه enforce می‌کند؛ این فقط presentation gate است
// itemهایی که route عملیاتی ندارند architecture target هستند
// ============================================

import {
  IconLayoutDashboard,
  IconActivity,
  IconArrowsLeftRight,
  IconDownload,
  IconUpload,
  IconCashBanknote,
  IconChartBar,
  IconBell,
  IconCalculator,
  IconCalendarClock,
  IconChartCandle,
  IconClipboardList,
  IconCode,
  IconCoins,
  IconFileDownload,
  IconFileText,
  IconFlag,
  IconFolders,
  IconGauge,
  IconWorld,
  IconHeartbeat,
  IconKey,
  IconBuildingBank,
  IconStack2,
  IconLifebuoy,
  IconLock,
  IconMapPin,
  IconDevices,
  IconPackage,
  IconPackages,
  IconScript,
  IconSettings,
  IconShare2,
  IconShieldExclamation,
  IconShieldCheck,
  IconShoppingBag,
  IconAdjustmentsHorizontal,
  IconBuildingStore,
  IconTag,
  IconDiscount,
  IconTrendingUp,
  IconUserCheck,
  IconUserCog,
  IconUsers,
  IconUsersGroup,
  IconWallet,
  IconBolt,
  type TablerIcon,
} from '@tabler/icons-react'
import { PERMISSIONS, type Permission } from '@/lib/auth/rbac'

export interface AdminNavItem {
  key: string
  label: string
  href: string
  icon: TablerIcon
  description: string
  /** حداقل یکی از این permissionها برای دیدن item لازم است */
  permissions: readonly Permission[]
}

export interface AdminNavSection {
  key: string
  label: string
  icon: TablerIcon
  items: readonly AdminNavItem[]
}

export const ADMIN_HOME = '/admin/dashboard'

export const ADMIN_NAV_SECTIONS: readonly AdminNavSection[] = [
  {
    key: 'overview',
    label: 'نمای کلی',
    icon: IconLayoutDashboard,
    items: [
      {
        key: 'dashboard',
        label: 'داشبورد',
        href: ADMIN_HOME,
        icon: IconLayoutDashboard,
        description: 'نمای عملیاتی و شاخص‌های کلیدی',
        permissions: [PERMISSIONS.DASHBOARD_READ],
      },
    ],
  },
  {
    key: 'customers',
    label: 'مشتریان',
    icon: IconUsersGroup,
    items: [
      {
        key: 'users',
        label: 'کاربران',
        href: '/admin/users',
        icon: IconUsers,
        description: 'مدیریت و جستجوی کاربران',
        permissions: [PERMISSIONS.USERS_READ],
      },
      {
        key: 'kyc',
        label: 'احراز هویت',
        href: '/admin/kyc',
        icon: IconUserCheck,
        description: 'صف بررسی و تصمیم KYC',
        permissions: [PERMISSIONS.KYC_READ],
      },
      {
        key: 'accounts',
        label: 'حساب‌ها',
        href: '/admin/accounts',
        icon: IconBuildingBank,
        description: 'حساب‌های دارایی و کیف پول',
        permissions: [PERMISSIONS.ACCOUNTS_READ],
      },
      {
        key: 'sessions',
        label: 'نشست‌ها',
        href: '/admin/security/sessions',
        icon: IconDevices,
        description: 'نشست‌های فعال کاربران',
        permissions: [PERMISSIONS.SECURITY_READ],
      },
    ],
  },
  {
    key: 'finance',
    label: 'معاملات و مالی',
    icon: IconArrowsLeftRight,
    items: [
      {
        key: 'trades',
        label: 'معاملات آنی',
        href: '/admin/trades',
        icon: IconBolt,
        description: 'خرید و فروش آنی طلا',
        permissions: [PERMISSIONS.ORDERS_READ],
      },
      {
        key: 'orderbooks',
        label: 'معاملات پیشرفته',
        href: '/admin/orderbooks',
        icon: IconChartCandle,
        description: 'دفتر سفارشات و معاملات پیشرفته',
        permissions: [PERMISSIONS.ORDERS_READ],
      },
      {
        key: 'orders',
        label: 'سفارش‌ها',
        href: '/admin/orders',
        icon: IconClipboardList,
        description: 'سفارش‌های خرید و فروش',
        permissions: [PERMISSIONS.ORDERS_READ],
      },
      {
        key: 'transactions',
        label: 'تراکنش‌ها',
        href: '/admin/transactions',
        icon: IconArrowsLeftRight,
        description: 'تراکنش‌های مالی',
        permissions: [PERMISSIONS.TRANSACTIONS_READ],
      },
      {
        key: 'fiat-transactions',
        label: 'تراکنش‌های تومان',
        href: '/admin/fiat-transactions',
        icon: IconCashBanknote,
        description: 'واریز و برداشت تومانی',
        permissions: [PERMISSIONS.TRANSACTIONS_READ],
      },
      {
        key: 'transfers',
        label: 'انتقال دارایی',
        href: '/admin/transfers',
        icon: IconArrowsLeftRight,
        description: 'انتقال‌های داخلی بین کاربران',
        permissions: [PERMISSIONS.TRANSACTIONS_READ],
      },
      {
        key: 'deposits',
        label: 'واریزها',
        href: '/admin/deposits',
        icon: IconDownload,
        description: 'واریزهای تومانی',
        permissions: [PERMISSIONS.DEPOSITS_READ],
      },
      {
        key: 'withdrawals',
        label: 'برداشت‌ها',
        href: '/admin/withdrawals',
        icon: IconUpload,
        description: 'درخواست‌های برداشت',
        permissions: [PERMISSIONS.WITHDRAWALS_READ],
      },
      {
        key: 'wallets',
        label: 'کیف پول‌ها',
        href: '/admin/wallets',
        icon: IconWallet,
        description: 'موجودی و وضعیت کیف پول‌ها',
        permissions: [PERMISSIONS.WALLETS_READ],
      },
      {
        key: 'gold',
        label: 'دارایی طلا',
        href: '/admin/gold',
        icon: IconCoins,
        description: 'موجودی و ذخایر طلا',
        permissions: [PERMISSIONS.GOLD_READ],
      },
      {
        key: 'pricing',
        label: 'قیمت‌گذاری',
        href: '/admin/pricing',
        icon: IconTag,
        description: 'قیمت و اسپرد طلا',
        permissions: [PERMISSIONS.PRICING_READ],
      },
      {
        key: 'user-fees',
        label: 'کارمزد کاربران',
        href: '/admin/user-fees',
        icon: IconDiscount,
        description: 'کارمزدهای اختصاصی کاربران',
        permissions: [PERMISSIONS.PRICING_READ],
      },
      {
        key: 'withdraw-limits',
        label: 'محدودیت برداشت',
        href: '/admin/withdraw-limits',
        icon: IconLock,
        description: 'سقف‌ها و محدودیت‌های برداشت',
        permissions: [PERMISSIONS.WITHDRAWALS_READ],
      },
      {
        key: 'trade-limits',
        label: 'محدودیت معاملات',
        href: '/admin/trade-limits',
        icon: IconAdjustmentsHorizontal,
        description: 'سقف‌ها و محدودیت‌های معاملات',
        permissions: [PERMISSIONS.ORDERS_READ],
      },
      {
        key: 'financial',
        label: 'حسابداری',
        href: '/admin/financial',
        icon: IconCalculator,
        description: 'دفتر کل، اسناد و گزارش‌های مالی',
        permissions: [PERMISSIONS.LEDGER_READ],
      },
    ],
  },
  {
    key: 'products',
    label: 'محصولات و دارایی‌ها',
    icon: IconPackage,
    items: [
      {
        key: 'tradeables',
        label: 'واحدهای قابل معامله',
        href: '/admin/tradeables',
        icon: IconCoins,
        description: 'واحدها و دارایی‌های قابل معامله',
        permissions: [PERMISSIONS.GOLD_READ],
      },
      {
        key: 'products',
        label: 'محصولات',
        href: '/admin/products',
        icon: IconShoppingBag,
        description: 'محصولات قابل عرضه',
        permissions: [PERMISSIONS.GOLD_READ],
      },
      {
        key: 'product-groups',
        label: 'دسته‌بندی‌های محصول',
        href: '/admin/product-groups',
        icon: IconFolders,
        description: 'گروه‌بندی و دسته‌بندی محصولات',
        permissions: [PERMISSIONS.CONTENT_READ],
      },
      {
        key: 'discounts',
        label: 'کدهای تخفیف',
        href: '/admin/discounts',
        icon: IconDiscount,
        description: 'کدها و کمپین‌های تخفیف',
        permissions: [PERMISSIONS.PRICING_READ],
      },
      {
        key: 'installments',
        label: 'خرید قسطی',
        href: '/admin/installments',
        icon: IconCalendarClock,
        description: 'قراردادهای قسطی',
        permissions: [PERMISSIONS.INSTALLMENTS_READ],
      },
      {
        key: 'investments',
        label: 'سرمایه‌گذاری',
        href: '/admin/investments',
        icon: IconTrendingUp,
        description: 'صندوق‌ها و موقعیت‌ها',
        permissions: [PERMISSIONS.INVESTMENTS_READ],
      },
      {
        key: 'referrals',
        label: 'معرفی',
        href: '/admin/referrals',
        icon: IconShare2,
        description: 'برنامه معرفی دوستان',
        permissions: [PERMISSIONS.REFERRALS_READ],
      },
      {
        key: 'product-transactions',
        label: 'تحویل فیزیکی',
        href: '/admin/product-transactions',
        icon: IconPackages,
        description: 'درخواست‌ها و سفارش‌های تحویل فیزیکی',
        permissions: [PERMISSIONS.GOLD_READ],
      },
      {
        key: 'delivery-locations',
        label: 'ارسال پستی محصولات',
        href: '/admin/delivery-locations',
        icon: IconMapPin,
        description: 'تنظیمات ارسال و مناطق پستی',
        permissions: [PERMISSIONS.SETTINGS_READ],
      },
      {
        key: 'products-branch',
        label: 'شعب و زمان‌بندی',
        href: '/admin/products-branch',
        icon: IconBuildingStore,
        description: 'شعب حضوری و زمان‌بندی تحویل',
        permissions: [PERMISSIONS.SETTINGS_READ],
      },
    ],
  },
  {
    key: 'service',
    label: 'خدمات',
    icon: IconLifebuoy,
    items: [
      {
        key: 'support',
        label: 'پشتیبانی',
        href: '/admin/support',
        icon: IconLifebuoy,
        description: 'تیکت‌های پشتیبانی',
        permissions: [PERMISSIONS.TICKETS_READ],
      },
      {
        key: 'notifications',
        label: 'اعلان‌ها',
        href: '/admin/notifications',
        icon: IconBell,
        description: 'اعلان‌ها و قالب‌ها',
        permissions: [PERMISSIONS.NOTIFICATIONS_READ],
      },
    ],
  },
  {
    key: 'risk-security',
    label: 'ریسک و امنیت',
    icon: IconShieldExclamation,
    items: [
      {
        key: 'risk',
        label: 'ریسک',
        href: '/admin/risk',
        icon: IconShieldExclamation,
        description: 'قوانین و هشدارهای ریسک',
        permissions: [PERMISSIONS.RISK_READ],
      },
      {
        key: 'fraud',
        label: 'تقلب',
        href: '/admin/fraud',
        icon: IconActivity,
        description: 'سیگنال‌ها و بررسی تقلب',
        permissions: [PERMISSIONS.FRAUD_READ],
      },
      {
        key: 'security',
        label: 'امنیت',
        href: '/admin/security',
        icon: IconShieldCheck,
        description: 'رویدادها و سیاست‌های امنیتی',
        permissions: [PERMISSIONS.SECURITY_READ],
      },
      {
        key: 'audit-logs',
        label: 'لاگ ممیزی',
        href: '/admin/audit-logs',
        icon: IconScript,
        description: 'رویدادهای ممیزی append-only',
        permissions: [PERMISSIONS.AUDIT_READ],
      },
    ],
  },
  {
    key: 'content-growth',
    label: 'محتوا و رشد',
    icon: IconFileText,
    items: [
      {
        key: 'content',
        label: 'محتوا',
        href: '/admin/content',
        icon: IconFileText,
        description: 'محتوای CMS و صفحات',
        permissions: [PERMISSIONS.CONTENT_READ],
      },
      {
        key: 'seo',
        label: 'سئو',
        href: '/admin/seo',
        icon: IconWorld,
        description: 'متادیتا و سئو',
        permissions: [PERMISSIONS.SEO_READ],
      },
    ],
  },
  {
    key: 'intelligence',
    label: 'هوش و گزارش',
    icon: IconChartBar,
    items: [
      {
        key: 'reports',
        label: 'گزارش‌ها',
        href: '/admin/reports',
        icon: IconChartBar,
        description: 'گزارش‌ها و خروجی‌ها',
        permissions: [PERMISSIONS.REPORTS_READ],
      },
      {
        key: 'exports',
        label: 'تاریخچه خروجی‌ها',
        href: '/admin/exports',
        icon: IconFileDownload,
        description: 'تاریخچه فایل‌های خروجی',
        permissions: [PERMISSIONS.REPORTS_READ],
      },
    ],
  },
  {
    key: 'administration',
    label: 'مدیریت سیستم',
    icon: IconSettings,
    items: [
      {
        key: 'team',
        label: 'تیم',
        href: '/admin/team',
        icon: IconUsersGroup,
        description: 'اعضای تیم ادمین',
        permissions: [PERMISSIONS.TEAM_READ],
      },
      {
        key: 'roles',
        label: 'نقش‌ها و دسترسی‌ها',
        href: '/admin/team/roles',
        icon: IconKey,
        description: 'نقش‌ها و permissionها',
        permissions: [PERMISSIONS.ROLES_READ],
      },
      {
        key: 'levels',
        label: 'سطوح کاربران',
        href: '/admin/levels',
        icon: IconStack2,
        description: 'سطوح و محدودیت‌های کاربران',
        permissions: [PERMISSIONS.KYC_READ],
      },
      {
        key: 'settings',
        label: 'تنظیمات سامانه',
        href: '/admin/settings',
        icon: IconSettings,
        description: 'تنظیمات پلتفرم',
        permissions: [PERMISSIONS.SETTINGS_READ],
      },
      {
        key: 'orderbook-settings',
        label: 'تنظیمات معاملات پیشرفته',
        href: '/admin/orderbook',
        icon: IconGauge,
        description: 'پارامترهای دفتر سفارشات',
        permissions: [PERMISSIONS.SETTINGS_READ],
      },
      {
        key: 'feature-flags',
        label: 'Feature Flags',
        href: '/admin/feature-flags',
        icon: IconFlag,
        description: 'پرچم‌های قابلیت',
        permissions: [PERMISSIONS.FLAGS_READ],
      },
      {
        key: 'api',
        label: 'API',
        href: '/admin/api',
        icon: IconCode,
        description: 'کلیدها و webhookها',
        permissions: [PERMISSIONS.API_READ],
      },
      {
        key: 'system-health',
        label: 'سلامت سیستم',
        href: '/admin/system/health',
        icon: IconHeartbeat,
        description: 'وضعیت سرویس‌ها و زیرساخت',
        permissions: [PERMISSIONS.SYSTEM_READ],
      },
      {
        key: 'admin-profile',
        label: 'پروفایل مدیر',
        href: '/admin/profile',
        icon: IconUserCog,
        description: 'پروفایل و امنیت حساب مدیر',
        permissions: [PERMISSIONS.DASHBOARD_READ],
      },
    ],
  },
]

// item فقط وقتی دیده می‌شود که حداقل یکی از permissionهایش resolve شده باشد
export function canSeeAdminItem(item: AdminNavItem, permissions: readonly Permission[]): boolean {
  return item.permissions.some((p) => permissions.includes(p))
}

// آیا هر آیتمی از این section فعال است — برای highlight آیکون بخش
export function isAdminNavSectionActive(section: AdminNavSection, pathname: string): boolean {
  return section.items.some((item) => isAdminNavItemActive(item, pathname))
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
