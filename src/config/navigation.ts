// ============================================
// Zar30 - PERMANENT USER NAVIGATION CONTRACT
// ============================================
// ⚠️ قانون دائمی پروژه (ADR: Permanent User Panel Navigation)
// Navigation اصلی User Panel همیشه دقیقاً این ۵ مقصد را با همین ترتیب دارد:
//   ۱. خانه  ۲. قسطی  ۳. معاملات (برجسته)  ۴. دارایی  ۵. پروفایل
//
// - Desktop (Sidebar) و Mobile (Bottom Nav) هر دو از همین Source of Truth استفاده می‌کنند
// - اضافه/حذف/تغییر ترتیب بدون ADR رسمی ممنوع است
// - Notifications / Support / Search هرگز nav item اصلی نمی‌شوند —
//   از طریق Header، Profile یا Contextual Actions در دسترس‌اند
//
//   Navigation Config → Desktop Navigation → Mobile Navigation
// ============================================

import { IconHome, IconRepeat, IconUser } from '@tabler/icons-react'
import { IconInstallment, IconWallet3d, type AppIcon } from '@/components/shared/icon-installment'

export interface NavItem {
  /** شناسه پایدار — هرگز تغییر نمی‌کند */
  key: 'home' | 'trade' | 'assets' | 'installments' | 'profile'
  label: string
  href: string
  icon: AppIcon
  /** توضیح کوتاه برای aria/tooltip */
  description: string
}

// ترتیب آرایه = ترتیب قرارداد — به همین ترتیب باید بماند
export const PANEL_NAV_ITEMS: readonly NavItem[] = [
  {
    key: 'home',
    label: 'خانه',
    href: '/dashboard',
    icon: IconHome,
    description: 'داشبورد و خلاصه حساب',
  },
  {
    key: 'installments',
    label: 'قسطی',
    href: '/dashboard/installments',
    icon: IconInstallment,
    description: 'طرح‌های اقساطی و قراردادها',
  },
  {
    key: 'trade',
    label: 'معاملات',
    href: '/dashboard/trade',
    icon: IconRepeat,
    description: 'خرید و فروش طلا و سفارش‌ها',
  },
  {
    key: 'assets',
    label: 'دارایی',
    href: '/dashboard/assets',
    icon: IconWallet3d,
    description: 'کیف پول، موجودی و تراکنش‌ها',
  },
  {
    key: 'profile',
    label: 'پروفایل',
    href: '/dashboard/profile',
    icon: IconUser,
    description: 'اطلاعات شخصی، امنیت و تنظیمات',
  },
] as const

// آیا مسیر فعلی به این آیتم nav تعلق دارد؟
// زیرمسیرهای هر بخش (مثل /dashboard/profile/sessions) همان آیتم را فعال نگه می‌دارند
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === '/dashboard') return pathname === '/dashboard'
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

// مسیرهایی که بخشی از navigation اصلی نیستند ولی زیر پنل قرار دارند
// (Notification Center از Header در دسترس است — nav item نیست)
export const UTILITY_ROUTES = {
  notifications: '/dashboard/notifications',
} as const
