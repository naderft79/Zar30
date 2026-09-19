// ============================================
// Zarnama - PERMANENT USER NAVIGATION CONTRACT
// ============================================
// ⚠️ قانون دائمی پروژه (ADR: Permanent User Panel Navigation)
// Navigation اصلی User Panel همیشه دقیقاً این ۵ مقصد را با همین ترتیب دارد:
//   ۱. خانه  ۲. معاملات  ۳. دارایی  ۴. قسطی  ۵. پروفایل
//
// - Desktop (Sidebar) و Mobile (Bottom Nav) هر دو از همین Source of Truth استفاده می‌کنند
// - اضافه/حذف/تغییر ترتیب بدون ADR رسمی ممنوع است
// - Notifications / Support / Search هرگز nav item اصلی نمی‌شوند —
//   از طریق Header، Profile یا Contextual Actions در دسترس‌اند
//
//   Navigation Config → Desktop Navigation → Mobile Navigation
// ============================================

import { CalendarClock, Home, Repeat, User, Wallet, type LucideIcon } from 'lucide-react'

export interface NavItem {
  /** شناسه پایدار — هرگز تغییر نمی‌کند */
  key: 'home' | 'trade' | 'assets' | 'installments' | 'profile'
  label: string
  href: string
  icon: LucideIcon
  /** توضیح کوتاه برای aria/tooltip */
  description: string
}

// ترتیب آرایه = ترتیب قرارداد — به همین ترتیب باید بماند
export const PANEL_NAV_ITEMS: readonly NavItem[] = [
  {
    key: 'home',
    label: 'خانه',
    href: '/dashboard',
    icon: Home,
    description: 'داشبورد و خلاصه حساب',
  },
  {
    key: 'trade',
    label: 'معاملات',
    href: '/dashboard/trade',
    icon: Repeat,
    description: 'خرید و فروش طلا و سفارش‌ها',
  },
  {
    key: 'assets',
    label: 'دارایی',
    href: '/dashboard/assets',
    icon: Wallet,
    description: 'کیف پول، موجودی و تراکنش‌ها',
  },
  {
    key: 'installments',
    label: 'قسطی',
    href: '/dashboard/installments',
    icon: CalendarClock,
    description: 'طرح‌های اقساطی و قراردادها',
  },
  {
    key: 'profile',
    label: 'پروفایل',
    href: '/dashboard/profile',
    icon: User,
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
