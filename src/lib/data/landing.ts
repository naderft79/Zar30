// ============================================
// Zar30 - Landing Page Content Data
// ============================================
// محتوای صفحات Public — بعداً می تواند از CMS مدیریت شود
// جدول cms_contents در schema برای همین منظور طراحی شده
// ============================================

import type { LucideIcon } from 'lucide-react'
import {
  Coins,
  ArrowLeftRight,
  CalendarClock,
  TrendingUp,
  Package,
  Send,
  ShieldCheck,
  Eye,
  Lock,
  FileSearch,
  Wallet,
  UserCheck,
  CircleDollarSign,
  BarChart3,
  Landmark,
} from 'lucide-react'

// ---------- ناوبری ----------
export interface NavLink {
  href: string
  label: string
}

export const NAV_LINKS: NavLink[] = [
  { href: '/#features', label: 'امکانات' },
  { href: '/#price', label: 'قیمت طلا' },
  { href: '/#how-it-works', label: 'نحوه کار' },
  { href: '/#investment', label: 'سرمایه‌گذاری' },
  { href: '/#faq', label: 'سوالات متداول' },
  { href: '/blog', label: 'بلاگ' },
  { href: '/about', label: 'درباره ما' },
]

export const FOOTER_LINKS: { title: string; links: NavLink[] }[] = [
  {
    title: 'محصول',
    links: [
      { href: '/#features', label: 'امکانات' },
      { href: '/#price', label: 'قیمت طلا' },
      { href: '/#investment', label: 'سرمایه‌گذاری' },
      { href: '/#installment', label: 'خرید اقساطی' },
      { href: '/#delivery', label: 'تحویل فیزیکی' },
    ],
  },
  {
    title: 'شرکت',
    links: [
      { href: '/about', label: 'درباره زرسی' },
      { href: '/blog', label: 'بلاگ' },
      { href: '/contact', label: 'تماس با ما' },
    ],
  },
  {
    title: 'پشتیبانی',
    links: [
      { href: '/faq', label: 'سوالات متداول' },
      { href: '/security', label: 'امنیت' },
      { href: '/contact', label: 'ارتباط با پشتیبانی' },
    ],
  },
  {
    title: 'حقوقی',
    links: [
      { href: '/terms', label: 'شرایط استفاده' },
      { href: '/privacy', label: 'حریم خصوصی' },
      { href: '/security', label: 'سیاست امنیت' },
    ],
  },
]

// ---------- امکانات (۶ کارت طبق MEGAPLAN) ----------
export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export const FEATURES: Feature[] = [
  {
    icon: Coins,
    title: 'خرید طلای آب‌شده',
    description: 'خرید طلای ۱۸ عیار با هر مبلغی — حتی از چند هزار تومان — بدون اجرت ساخت.',
  },
  {
    icon: ArrowLeftRight,
    title: 'فروش آنی',
    description: 'طلای خود را در هر لحظه به ریال تبدیل کنید و وجه را برداشت نمایید.',
  },
  {
    icon: CalendarClock,
    title: 'خرید اقساطی',
    description: 'طلای موردنظر خود را به‌صورت اقساطی خریداری و در پایان تحویل بگیرید.',
  },
  {
    icon: TrendingUp,
    title: 'سرمایه‌گذاری طلا',
    description: 'در طرح‌های سوددهی طلایی شرکت کنید و دارایی خود را مدیریت کنید.',
  },
  {
    icon: Package,
    title: 'تحویل فیزیکی',
    description: 'طلای دیجیتال خود را به‌صورت فیزیکی و بیمه‌شده درب منزل تحویل بگیرید.',
  },
  {
    icon: Send,
    title: 'انتقال طلا',
    description: 'به دیگر کاربران زرسی طلا هدیه دهید یا منتقل کنید — سریع و بدون واسطه.',
  },
]

// ---------- چرا زرسی ----------
export const WHY_ZAR30: Feature[] = [
  {
    icon: ShieldCheck,
    title: 'امنیت چندلایه',
    description: 'احراز هویت چندمرحله‌ای، رمزنگاری داده‌ها و زیرساخت مالی حسابرسی‌شده.',
  },
  {
    icon: Eye,
    title: 'شفافیت کامل',
    description: 'هر تراکنش در دفتر کل دوطرفه ثبت می‌شود و قابل راستی‌آزمایی است.',
  },
  {
    icon: Lock,
    title: 'پشتوانه طلای واقعی',
    description: 'هر گرم طلای دیجیتال متناظر با طلای فیزیکی نگهداری‌شده در خزانه است.',
  },
  {
    icon: FileSearch,
    title: 'قابل حسابرسی',
    description: 'معماری مبتنی بر Double-Entry Ledger — هیچ تراکنشی بدون سند ثبت نمی‌شود.',
  },
]

// ---------- مراحل کار ----------
export interface Step {
  icon: LucideIcon
  title: string
  description: string
}

export const HOW_IT_WORKS: Step[] = [
  {
    icon: UserCheck,
    title: 'ثبت‌نام',
    description: 'با شماره موبایل در کمتر از یک دقیقه ثبت‌نام کنید.',
  },
  {
    icon: ShieldCheck,
    title: 'احراز هویت',
    description: 'هویت خود را با کارت ملی و سلفی تایید کنید.',
  },
  {
    icon: Wallet,
    title: 'شارژ حساب',
    description: 'کیف پول ریالی خود را از طریق درگاه بانکی شارژ کنید.',
  },
  {
    icon: CircleDollarSign,
    title: 'خرید طلا',
    description: 'با هر مبلغی طلای آب‌شده ۱۸ عیار بخرید.',
  },
  {
    icon: BarChart3,
    title: 'مدیریت دارایی',
    description: 'دارایی خود را پیگیری کنید، بفروشید یا تحویل بگیرید.',
  },
]

// ---------- آمار ----------
// نکته: هیچ عدد استفاده/کاربران ساختگی نمایش داده نمی‌شود (پلتفرم مالی — Fake Social Proof ممنوع)
// این مقادیر فقط قابلیت‌های واقعی محصول هستند؛ آمار واقعی پس از لانش از DB تغذیه می‌شود
export interface Stat {
  value: string
  label: string
  icon: LucideIcon
}

export const STATS: Stat[] = [
  { icon: Coins, value: 'با هر مبلغی', label: 'خرید طلا — حتی میلی‌گرمی' },
  { icon: ArrowLeftRight, value: '۲۴/۷', label: 'معامله آنلاین' },
  { icon: FileSearch, value: '۱۰۰٪', label: 'شفافیت دفتر کل' },
  { icon: ShieldCheck, value: '۴ سطح', label: 'احراز هویت چندمرحله‌ای' },
]

// ---------- FAQ ----------
export interface Faq {
  question: string
  answer: string
}

export const FAQS: Faq[] = [
  {
    question: 'زرسی چیست و چگونه کار می‌کند؟',
    answer:
      'زرسی پلتفرمی برای خرید، فروش و نگهداری طلای آب‌شده ۱۸ عیار به‌صورت دیجیتال است. شما می‌توانید با هر مبلغی طلا بخرید، آن را در حساب خود نگه دارید، هر زمان بفروشید یا به‌صورت فیزیکی تحویل بگیرید.',
  },
  {
    question: 'آیا طلای من واقعاً وجود دارد؟',
    answer:
      'بله. هر گرم طلای دیجیتال در زرسی متناظر با طلای فیزیکی نگهداری‌شده در خزانه‌های امن است. تمام تراکنش‌ها در دفتر کل دوطرفه (Double-Entry) ثبت و قابل حسابرسی هستند.',
  },
  {
    question: 'حداقل مبلغ خرید طلا چقدر است؟',
    answer:
      'شما می‌توانید با مبالغ بسیار کوچک شروع کنید. هدف زرسی این است که سرمایه‌گذاری روی طلا برای همه در دسترس باشد.',
  },
  {
    question: 'چگونه طلای خود را به‌صورت فیزیکی تحویل بگیرم؟',
    answer:
      'پس از تکمیل احراز هویت، می‌توانید درخواست تحویل فیزیکی ثبت کنید. طلا با بسته‌بندی امن و بیمه‌شده به آدرس شما ارسال می‌شود. جزئیات و شرایط تحویل در بخش تحویل فیزیکی توضیح داده شده است.',
  },
  {
    question: 'خرید اقساطی چگونه کار می‌کند؟',
    answer:
      'در طرح خرید اقساطی، مبلغ طلا را به چند قسط تقسیم می‌کنید و پس از تسویه کامل، مالکیت طلا به شما منتقل می‌شود. شرایط و نرخ‌ها در هنگام ثبت درخواست به‌صورت شفاف نمایش داده می‌شود.',
  },
  {
    question: 'امنیت حساب من چگونه تضمین می‌شود؟',
    answer:
      'زرسی از احراز هویت چندمرحله‌ای (OTP + رمز عبور + 2FA اختیاری)، رمزنگاری داده‌ها، ثبت لاگ امنیتی و زیرساخت مالی قابل حسابرسی استفاده می‌کند. جزئیات بیشتر در صفحه امنیت آمده است.',
  },
  {
    question: 'کارمزد خرید و فروش چقدر است؟',
    answer:
      'ساختار کارمزد زرسی شفاف است و قبل از هر تراکنش به‌صورت کامل نمایش داده می‌شود. هیچ هزینه پنهانی وجود ندارد.',
  },
  {
    question: 'اگر گوشی خود را گم کنم چه اتفاقی برای حسابم می‌افتد؟',
    answer:
      'دارایی شما در حساب زرنامای شماست نه روی دستگاه. با ورود مجدد از دستگاه جدید به دارایی خود دسترسی دارید. نشست‌های فعال را می‌توانید از بخش امنیت حساب مدیریت و لغو کنید.',
  },
]

// ---------- نظرات کاربران ----------
// عمداً حذف شد: نمایش نظر ساختگی برای پلتفرم مالی مجاز نیست (Fake Social Proof ممنوع)
// پس از لانش واقعی و کسب رضایت‌نامه واقعی کاربران، از CMS تغذیه می‌شود

// ---------- نشان‌های اعتماد ----------
export const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'احراز هویت چندسطحی' },
  { icon: Lock, label: 'رمزنگاری داده‌ها' },
  { icon: FileSearch, label: 'دفتر کل قابل حسابرسی' },
  { icon: Landmark, label: 'پشتوانه طلای فیزیکی' },
]
