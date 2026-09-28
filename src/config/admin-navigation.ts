// ============================================
// Zar30 - Admin Navigation Source of Truth
// ============================================
// Sidebar/Desktop + Drawer/Mobile هر دو از همین config استفاده می‌کنند
// هر section آیکون اختصاصی دارد؛ هر item فقط با permission متناظر دیده می‌شود
// API همیشه enforce می‌کند؛ این فقط presentation gate است
// itemهایی که route عملیاتی ندارند architecture target هستند
// ============================================

import {
  IconActivity,
  IconArrowsLeftRight,
  IconBuildingBank,
  IconCashBanknote,
  IconCalculator,
  IconCalendarClock,
  IconChartBar,
  IconClipboardList,
  IconCoins,
  IconCreditCard,
  IconDeviceMobile,
  IconDevices,
  IconDiscount,
  IconDownload,
  IconFileText,
  IconFlag,
  IconFolders,
  IconGauge,
  IconHeartbeat,
  IconHistory,
  IconKey,
  IconLayoutDashboard,
  IconLifebuoy,
  IconLock,
  IconMapPin,
  IconPackage,
  IconPackages,
  IconScale,
  IconScript,
  IconSettings,
  IconShieldCheck,
  IconShieldExclamation,
  IconShoppingBag,
  IconStack2,
  IconTag,
  IconTrendingUp,
  IconUpload,
  IconUserCheck,
  IconUserCog,
  IconUsers,
  IconUsersGroup,
  IconWallet,
  IconWorld,
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
  /** کلید شمارنده pending — از GET /api/v1/admin/nav-badges تغذیه می‌شود */
  badgeKey?: 'kyc' | 'withdrawals' | 'orders' | 'tickets' | 'risk' | 'delivery'
}

export interface AdminNavSection {
  key: string
  label: string
  icon: TablerIcon
  items: readonly AdminNavItem[]
}

export const ADMIN_HOME = '/admin/dashboard'

export const ADMIN_NAV_SECTIONS: readonly AdminNavSection[] = [
  // ---------- ۱. نمای کلی ----------
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

  // ---------- ۲. مشتریان ----------
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
        badgeKey: 'kyc',
        icon: IconUserCheck,
        description: 'صف بررسی و تصمیم KYC',
        permissions: [PERMISSIONS.KYC_READ],
      },
      {
        key: 'levels',
        label: 'سطوح کاربران',
        href: '/admin/levels',
        icon: IconStack2,
        description: 'سطوح و محدودیت‌های کاربران',
        permissions: [PERMISSIONS.LEVELS_READ],
      },
      {
        key: 'referrals',
        label: 'معرفی دوستان',
        href: '/admin/referrals',
        icon: IconUsersGroup,
        description: 'برنامه معرفی دوستان',
        permissions: [PERMISSIONS.REFERRALS_READ],
      },
    ],
  },

  // ---------- ۳. حساب‌ها و کیف پول ----------
  {
    key: 'accounts-wallets',
    label: 'حساب‌ها و کیف پول',
    icon: IconWallet,
    items: [
      {
        key: 'accounts',
        label: 'حساب‌های دارایی',
        href: '/admin/accounts',
        icon: IconWallet,
        description: 'حساب‌های دارایی و کیف پول',
        permissions: [PERMISSIONS.ACCOUNTS_READ],
      },
      {
        key: 'wallets',
        label: 'کیف پول‌ها',
        href: '/admin/wallets',
        icon: IconCreditCard,
        description: 'موجودی و وضعیت کیف پول‌ها',
        permissions: [PERMISSIONS.WALLETS_READ],
      },
      {
        key: 'bank-accounts',
        label: 'کارت‌های بانکی',
        href: '/admin/bank-accounts',
        icon: IconBuildingBank,
        description: 'کارت‌ها و شباهای ثبت‌شده کاربران',
        permissions: [PERMISSIONS.BANK_ACCOUNTS_READ],
      },
      {
        key: 'addresses',
        label: 'آدرس‌ها',
        href: '/admin/addresses',
        icon: IconMapPin,
        description: 'آدرس‌های تحویل فیزیکی کاربران',
        permissions: [PERMISSIONS.ADDRESSES_READ],
      },
    ],
  },

  // ---------- ۴. معاملات ----------
  {
    key: 'trading',
    label: 'معاملات',
    icon: IconArrowsLeftRight,
    items: [
      {
        key: 'orders',
        label: 'سفارش‌ها',
        href: '/admin/orders',
        badgeKey: 'orders',
        icon: IconClipboardList,
        description: 'سفارش‌های خرید و فروش',
        permissions: [PERMISSIONS.ORDERS_READ],
      },
      {
        key: 'trade-limits',
        label: 'محدودیت معاملات',
        href: '/admin/trade-limits',
        icon: IconScale,
        description: 'سقف‌ها و محدودیت‌های معاملات',
        permissions: [PERMISSIONS.LIMITS_READ],
      },
    ],
  },

  // ---------- ۵. واریز و برداشت ----------
  {
    key: 'funds',
    label: 'واریز و برداشت',
    icon: IconCashBanknote,
    items: [
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
        badgeKey: 'withdrawals',
        icon: IconUpload,
        description: 'درخواست‌های برداشت',
        permissions: [PERMISSIONS.WITHDRAWALS_READ],
      },
      {
        key: 'withdraw-limits',
        label: 'محدودیت برداشت',
        href: '/admin/withdraw-limits',
        icon: IconLock,
        description: 'سقف‌ها و محدودیت‌های برداشت',
        permissions: [PERMISSIONS.LIMITS_READ],
      },
      {
        key: 'payments',
        label: 'پرداخت‌های درگاه',
        href: '/admin/payments',
        icon: IconCreditCard,
        description: 'تراکنش‌های درگاه پرداخت',
        permissions: [PERMISSIONS.PAYMENTS_READ],
      },
    ],
  },

  // ---------- ۶. تراکنش‌ها و انتقال‌ها ----------
  {
    key: 'transactions-transfers',
    label: 'تراکنش‌ها و انتقال',
    icon: IconArrowsLeftRight,
    items: [
      {
        key: 'transactions',
        label: 'تراکنش‌ها',
        href: '/admin/transactions',
        icon: IconHistory,
        description: 'تراکنش‌های مالی',
        permissions: [PERMISSIONS.TRANSACTIONS_READ],
      },
      {
        key: 'transfers',
        label: 'انتقال دارایی',
        href: '/admin/transfers',
        icon: IconArrowsLeftRight,
        description: 'انتقال‌های داخلی بین کاربران',
        permissions: [PERMISSIONS.TRANSFERS_READ],
      },
      {
        key: 'transfer-limits',
        label: 'محدودیت انتقال',
        href: '/admin/transfer-limits',
        icon: IconScale,
        description: 'سقف‌های انتقال طلا بین کاربران',
        permissions: [PERMISSIONS.LIMITS_READ],
      },
    ],
  },

  // ---------- ۷. قیمت‌گذاری و کارمزد ----------
  {
    key: 'pricing-fees',
    label: 'قیمت‌گذاری و کارمزد',
    icon: IconTag,
    items: [
      {
        key: 'pricing',
        label: 'قیمت‌گذاری',
        href: '/admin/pricing',
        icon: IconTag,
        description: 'قیمت و اسپرد طلا',
        permissions: [PERMISSIONS.PRICING_READ],
      },
      {
        key: 'fee-rules',
        label: 'قواعد کارمزد',
        href: '/admin/fee-rules',
        icon: IconScale,
        description: 'کارمزد گروهی بر اساس سطح و حجم',
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
    ],
  },

  // ---------- ۸. محصولات ----------
  {
    key: 'products',
    label: 'محصولات',
    icon: IconPackage,
    items: [
      {
        key: 'products',
        label: 'محصولات',
        href: '/admin/products',
        icon: IconShoppingBag,
        description: 'محصولات قابل عرضه',
        permissions: [PERMISSIONS.PRODUCTS_READ],
      },
      {
        key: 'product-groups',
        label: 'دسته‌بندی‌های محصول',
        href: '/admin/product-groups',
        icon: IconFolders,
        description: 'گروه‌بندی و دسته‌بندی محصولات',
        permissions: [PERMISSIONS.PRODUCTS_READ],
      },
      {
        key: 'coin-holdings',
        label: 'موجودی سکه و شمش',
        href: '/admin/coin-holdings',
        icon: IconCoins,
        description: 'موجودی فیزیکی کاربران به تفکیک محصول',
        permissions: [PERMISSIONS.PRODUCTS_READ],
      },
      {
        key: 'discounts',
        label: 'کدهای تخفیف',
        href: '/admin/discounts',
        icon: IconDiscount,
        description: 'کدها و کمپین‌های تخفیف',
        permissions: [PERMISSIONS.DISCOUNTS_READ],
      },
    ],
  },

  // ---------- ۹. تحویل فیزیکی ----------
  {
    key: 'delivery',
    label: 'تحویل فیزیکی',
    icon: IconPackages,
    items: [
      {
        key: 'product-transactions',
        label: 'درخواست‌های تحویل',
        href: '/admin/delivery',
        badgeKey: 'delivery',
        icon: IconPackages,
        description: 'درخواست‌ها و سفارش‌های تحویل فیزیکی',
        permissions: [PERMISSIONS.DELIVERY_READ],
      },
    ],
  },

  // ---------- ۱۰. خدمات ----------
  {
    key: 'services',
    label: 'خدمات',
    icon: IconCreditCard,
    items: [
      {
        key: 'zareesi-cards-service',
        label: 'کارت زرسی',
        href: '/admin/zareesi-cards',
        badgeKey: 'zareesi',
        icon: IconCreditCard,
        description: 'سفارش‌های کارت اعتباری طلایی — صدور، ارسال و فعال‌سازی',
        permissions: [PERMISSIONS.DELIVERY_READ],
      },
    ],
  },

  // ---------- ۱۱. خدمات مالی ----------
  {
    key: 'financial-services',
    label: 'خدمات مالی',
    icon: IconTrendingUp,
    items: [
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
        key: 'savings-plans',
        label: 'خرید خودکار',
        href: '/admin/savings-plans',
        icon: IconCalendarClock,
        description: 'طرح‌های خرید خودکار (SIP) کاربران',
        permissions: [PERMISSIONS.SIP_READ],
      },
    ],
  },

  // ---------- ۱۱. دارایی طلا و قیمت ----------
  {
    key: 'gold',
    label: 'دارایی طلا',
    icon: IconCoins,
    items: [
      {
        key: 'gold',
        label: 'موجودی و ذخایر',
        href: '/admin/gold',
        icon: IconCoins,
        description: 'موجودی و ذخایر طلا',
        permissions: [PERMISSIONS.GOLD_READ],
      },
      {
        key: 'price-alerts',
        label: 'هشدارهای قیمت',
        href: '/admin/price-alerts',
        icon: IconDeviceMobile,
        description: 'هشدارهای قیمت ثبت‌شده کاربران',
        permissions: [PERMISSIONS.ALERTS_READ],
      },
    ],
  },

  // ---------- ۱۲. حسابداری ----------
  {
    key: 'accounting',
    label: 'حسابداری',
    icon: IconCalculator,
    items: [
      {
        key: 'financial',
        label: 'دفتر کل و اسناد',
        href: '/admin/financial',
        icon: IconCalculator,
        description: 'دفتر کل، اسناد و گزارش‌های مالی',
        permissions: [PERMISSIONS.LEDGER_READ],
      },
      {
        key: 'reconciliation',
        label: 'تطبیق دفتر کل',
        href: '/admin/reconciliation',
        icon: IconScale,
        description: 'تطبیق موجودی‌ها با دفتر کل و مغایرت‌ها',
        permissions: [PERMISSIONS.LEDGER_READ],
      },
    ],
  },

  // ---------- ۱۳. پشتیبانی و اعلان‌ها ----------
  {
    key: 'service',
    label: 'پشتیبانی و اعلان',
    icon: IconLifebuoy,
    items: [
      {
        key: 'support',
        label: 'تیکت‌های پشتیبانی',
        href: '/admin/support',
        badgeKey: 'tickets',
        icon: IconLifebuoy,
        description: 'تیکت‌های پشتیبانی',
        permissions: [PERMISSIONS.TICKETS_READ],
      },
      {
        key: 'notifications',
        label: 'اعلان‌ها',
        href: '/admin/notifications',
        icon: IconDeviceMobile,
        description: 'اعلان‌ها و قالب‌ها',
        permissions: [PERMISSIONS.NOTIFICATIONS_READ],
      },
    ],
  },

  // ---------- ۱۴. ریسک و امنیت ----------
  {
    key: 'risk-security',
    label: 'ریسک و امنیت',
    icon: IconShieldExclamation,
    items: [
      {
        key: 'risk',
        label: 'ریسک',
        href: '/admin/risk',
        badgeKey: 'risk',
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
        key: 'sessions',
        label: 'نشست‌ها',
        href: '/admin/security/sessions',
        icon: IconDevices,
        description: 'نشست‌های فعال کاربران',
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

  // ---------- ۱۵. محتوا و سئو ----------
  {
    key: 'content-growth',
    label: 'محتوا و سئو',
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

  // ---------- ۱۶. گزارش‌ها ----------
  {
    key: 'reports',
    label: 'گزارش‌ها',
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
        icon: IconDownload,
        description: 'تاریخچه فایل‌های خروجی',
        permissions: [PERMISSIONS.REPORTS_READ],
      },
    ],
  },

  // ---------- ۱۷. مدیریت سیستم ----------
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
        key: 'settings',
        label: 'تنظیمات سامانه',
        href: '/admin/settings',
        icon: IconSettings,
        description: 'تنظیمات پلتفرم',
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
        key: 'rate-limits',
        label: 'Rate Limiting',
        href: '/admin/rate-limits',
        icon: IconGauge,
        description: 'قوانین محدودیت نرخ درخواست',
        permissions: [PERMISSIONS.RATELIMIT_READ],
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
