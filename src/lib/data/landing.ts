// ============================================
// Zar30 - Landing Page Content Data (Gerami-style)
// ============================================
// محتوای صفحه اصلی — ساختار ناوبری، کارت‌های اعتماد،
// مراحل کار، FAQ، فوتر و لایه SEO
// هیچ آمار/مجوز/شرکتِ ساختگی در این فایل مجاز نیست
// ============================================

import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  BadgeCheck,
  CalendarClock,
  Coins,
  FileSearch,
  Landmark,
  Lock,
  Package,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  Truck,
  UserCheck,
  Wallet,
} from 'lucide-react'

// ---------- ناوبری Header ----------
export interface NavLink {
  href: string
  label: string
}

/** آیتم‌های سطح اول — لینک ساده یا dropdown */
export interface NavItem {
  href?: string
  label: string
  children?: NavLink[]
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/#buy', label: 'خرید طلا' },
  { href: '/#price', label: 'قیمت طلا' },
  { href: '/#investment', label: 'سرمایه‌گذاری' },
  { href: '/blog', label: 'بلاگ' },
  { href: '/about', label: 'درباره زرسی' },
  {
    label: 'پشتیبانی',
    children: [
      { href: '/faq', label: 'سوالات متداول' },
      { href: '/contact', label: 'تماس با ما' },
    ],
  },
  {
    label: 'قوانین',
    children: [
      { href: '/terms', label: 'قوانین و مقررات' },
      { href: '/privacy', label: 'حریم خصوصی' },
    ],
  },
]

// ---------- کارت‌های اعتماد ----------
export interface TrustCard {
  icon: LucideIcon
  title: string
  description: string
}

export const TRUST_CARDS: TrustCard[] = [
  {
    icon: Landmark,
    title: 'پشتوانه طلای فیزیکی',
    description: 'هر گرم طلای دیجیتال زرسی متناظر با طلای ۱۸ عیار نگهداری‌شده در خزانه است.',
  },
  {
    icon: ReceiptText,
    title: 'کارمزد شفاف',
    description: 'ساختار کارمزد و اسپرد قبل از هر تراکنش به‌صورت کامل نمایش داده می‌شود.',
  },
  {
    icon: ShieldCheck,
    title: 'امنیت چندلایه',
    description: 'احراز هویت چندمرحله‌ای، رمزنگاری داده‌ها و نشست‌های قابل مدیریت.',
  },
  {
    icon: Package,
    title: 'تحویل فیزیکی',
    description: 'طلای دیجیتال خود را با بسته‌بندی امن و بیمه‌شده تحویل بگیرید.',
  },
]

// ---------- نشان‌های اعتماد (Marquee) ----------
// فقط حقایق واقعی محصول — هیچ مجوز/نماد ساختگی نمایش داده نمی‌شود
export const TRUST_STRIP_ITEMS = [
  'پشتوانه طلای فیزیکی ۱۸ عیار',
  'دفتر کل دوطرفه قابل حسابرسی',
  'احراز هویت چندمرحله‌ای',
  'رمزنگاری داده‌های حساس',
  'خرید با هر مبلغی — حتی میلی‌گرمی',
  'فروش آنی و برداشت ریالی',
  'تحویل فیزیکی بیمه‌شده',
  'کارمزد شفاف بدون هزینه پنهان',
]

// ---------- مراحل کار (۴ مرحله) ----------
export interface Step {
  icon: LucideIcon
  title: string
  description: string
}

export const HOW_IT_WORKS_STEPS: Step[] = [
  {
    icon: UserCheck,
    title: 'ثبت‌نام و احراز هویت',
    description: 'با شماره موبایل ثبت‌نام کنید و هویت خود را با کارت ملی تایید کنید.',
  },
  {
    icon: Wallet,
    title: 'شارژ حساب',
    description: 'کیف پول ریالی خود را از طریق درگاه بانکی شارژ کنید.',
  },
  {
    icon: Coins,
    title: 'خرید طلا',
    description: 'با هر مبلغی طلای آب‌شده ۱۸ عیار بخرید — بدون اجرت ساخت.',
  },
  {
    icon: TrendingUp,
    title: 'مدیریت، فروش و تحویل',
    description: 'دارایی خود را پیگیری کنید، بفروشید یا به‌صورت فیزیکی تحویل بگیرید.',
  },
]

// ---------- بخش‌های ویژگی محصول ----------
export interface FeatureBulletItem {
  icon: LucideIcon
  text: string
}

export interface FeatureSectionData {
  id: string
  eyebrow: string
  title: string
  description: string
  bullets: FeatureBulletItem[]
  cta: { href: string; label: string }
  visual: 'buy' | 'investment' | 'installment'
  /** سمت ویژوال در دسکتاپ — پیش‌فرض چپ (متن راست) */
  reverse?: boolean
}

export const FEATURE_SECTIONS: FeatureSectionData[] = [
  {
    id: 'buy',
    eyebrow: 'خرید و فروش',
    title: 'طلای آب‌شده را مثل یک دارایی بخرید و بفروشید',
    description:
      'در زرسی طلا یک دارایی قابل مدیریت است، نه یک کالای مصرفی. با هر مبلغی بخرید، هر زمان بفروشید و وجه را برداشت کنید.',
    bullets: [
      { icon: Coins, text: 'خرید طلای ۱۸ عیار با هر مبلغی — حتی میلی‌گرمی' },
      { icon: ArrowLeftRight, text: 'فروش آنی و تبدیل به ریال در هر لحظه' },
      { icon: BadgeCheck, text: 'بدون اجرت ساخت و بدون واسطه' },
      { icon: ReceiptText, text: 'کارمزد شفاف قبل از هر تراکنش' },
    ],
    cta: { href: '/register', label: 'شروع خرید طلا' },
    visual: 'buy',
  },
  {
    id: 'investment',
    eyebrow: 'سرمایه‌گذاری',
    title: 'سرمایه‌گذاری روی طلا، تورم‌زدا و بلندمدت',
    description:
      'طلای خود را نگه دارید یا در طرح‌های سوددهی طلایی شرکت کنید. سود شما به‌صورت طلا محاسبه می‌شود، نه ریال.',
    bullets: [
      { icon: TrendingUp, text: 'طرح‌های سرمایه‌گذاری با سود طلایی' },
      { icon: Lock, text: 'طلای شما جدا و متناظر با خزانه نگهداری می‌شود' },
      { icon: FileSearch, text: 'تاریخچه کامل دارایی قابل پیگیری است' },
      { icon: Package, text: 'امکان تحویل فیزیکی در پایان طرح' },
    ],
    cta: { href: '/register', label: 'شروع سرمایه‌گذاری' },
    visual: 'investment',
    reverse: true,
  },
  {
    id: 'installment',
    eyebrow: 'خرید قسطی',
    title: 'طلای موردنظر را قسطی تهیه کنید',
    description:
      'مبلغ طلا را به اقساط تقسیم کنید و پس از تسویه کامل، مالکیت طلا به شما منتقل می‌شود. شرایط و نرخ‌ها شفاف نمایش داده می‌شود.',
    bullets: [
      { icon: CalendarClock, text: 'طرح‌های ۱۲، ۱۸ و ۲۴ ماهه' },
      { icon: ShieldCheck, text: 'بدون نیاز به چک در اعتبارسنجی داخلی' },
      { icon: Coins, text: 'طلا پس از تسویه به کیف پول شما اضافه می‌شود' },
      { icon: ReceiptText, text: 'مبلغ هر قسط از ابتدا مشخص است' },
    ],
    cta: { href: '/register', label: 'خرید قسطی طلا' },
    visual: 'installment',
  },
]

// ---------- تحویل فیزیکی ----------
export const DELIVERY_BULLETS: FeatureBulletItem[] = [
  { icon: Package, text: 'ثبت درخواست تحویل از پنل کاربری' },
  { icon: ShieldCheck, text: 'بسته‌بندی امن و بیمه‌شده' },
  { icon: ReceiptText, text: 'فاکتور رسمی همراه مرسوله' },
  { icon: BadgeCheck, text: 'تضمین اصالت طلای تحویلی' },
  { icon: Truck, text: 'ارسال به آدرس شما پس از تکمیل احراز هویت' },
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
      'دارایی شما در حساب زرسی شماست نه روی دستگاه. با ورود مجدد از دستگاه جدید به دارایی خود دسترسی دارید. نشست‌های فعال را می‌توانید از بخش امنیت حساب مدیریت و لغو کنید.',
  },
]

// ---------- اطلاعات تماس (واقعی پروژه) ----------
export const CONTACT_INFO = {
  phone: '۰۲۱-۹۱۰۰۹۰۹۰',
  phoneHref: 'tel:+982191009090',
  email: 'support@zar30.com',
  hours: 'شنبه تا پنجشنبه، ۹ تا ۱۸',
}

// ---------- فوتر ----------
export const FOOTER_LINKS: { title: string; links: NavLink[] }[] = [
  {
    title: 'دسترسی سریع',
    links: [
      { href: '/#buy', label: 'خرید طلا' },
      { href: '/#price', label: 'قیمت طلا' },
      { href: '/about', label: 'درباره زرسی' },
      { href: '/blog', label: 'بلاگ' },
    ],
  },
  {
    title: 'پشتیبانی',
    links: [
      { href: '/faq', label: 'سوالات متداول' },
      { href: '/contact', label: 'تماس با ما' },
      { href: '/terms', label: 'قوانین و مقررات' },
      { href: '/privacy', label: 'حریم خصوصی' },
    ],
  },
  {
    title: 'خدمات',
    links: [
      { href: '/#buy', label: 'خرید طلا' },
      { href: '/#buy', label: 'فروش طلا' },
      { href: '/#price', label: 'قیمت طلا' },
      { href: '/#delivery', label: 'تحویل فیزیکی' },
    ],
  },
]

// ---------- نشان‌های فوتر (فقط حقایق واقعی) ----------
export const FOOTER_BADGES = [
  { icon: Landmark, label: 'پشتوانه طلای فیزیکی' },
  { icon: FileSearch, label: 'دفتر کل قابل حسابرسی' },
  { icon: ShieldCheck, label: 'احراز هویت چندمرحله‌ای' },
  { icon: Lock, label: 'رمزنگاری داده‌ها' },
]

// ---------- آمار (صفحه درباره) ----------
// فقط قابلیت‌های واقعی محصول — هیچ عدد استفاده/کاربران ساختگی (Fake Social Proof ممنوع)
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
