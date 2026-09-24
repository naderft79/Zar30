// ============================================
// Zar30 - Landing Page Content Data (Gerami-style)
// ============================================
// محتوای صفحه اصلی — ساختار ناوبری، کارت‌های اعتماد،
// مراحل کار، FAQ، فوتر و لایه SEO
// هیچ آمار/مجوز/شرکتِ ساختگی در این فایل مجاز نیست
// ============================================

import {
  type TablerIcon,
  IconArrowsLeftRight,
  IconRosetteDiscountCheck,
  IconCalendarClock,
  IconCoins,
  IconFileSearch,
  IconBuildingBank,
  IconLock,
  IconPackage,
  IconReceipt,
  IconShieldCheck,
  IconTrendingUp,
  IconTruck,
  IconUserCheck,
  IconWallet,
} from '@tabler/icons-react'

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
  icon: TablerIcon
  title: string
  description: string
}

export const TRUST_CARDS: TrustCard[] = [
  {
    icon: IconBuildingBank,
    title: 'پشتوانه طلای فیزیکی',
    description: 'هر گرم طلای دیجیتال زرسی متناظر با طلای ۱۸ عیار نگهداری‌شده در خزانه است.',
  },
  {
    icon: IconReceipt,
    title: 'کارمزد شفاف',
    description: 'ساختار کارمزد و اسپرد قبل از هر تراکنش به‌صورت کامل نمایش داده می‌شود.',
  },
  {
    icon: IconShieldCheck,
    title: 'امنیت چندلایه',
    description: 'احراز هویت چندمرحله‌ای، رمزنگاری داده‌ها و نشست‌های قابل مدیریت.',
  },
  {
    icon: IconPackage,
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
  'فروش آنی و برداشت تومانی',
  'تحویل فیزیکی بیمه‌شده',
  'کارمزد شفاف بدون هزینه پنهان',
]

// ---------- مراحل کار (۴ مرحله) ----------
export interface Step {
  icon: TablerIcon
  title: string
  description: string
}

export const HOW_IT_WORKS_STEPS: Step[] = [
  {
    icon: IconUserCheck,
    title: 'ثبت‌نام و احراز هویت',
    description: 'با شماره موبایل ثبت‌نام کنید و هویت خود را با کارت ملی تایید کنید.',
  },
  {
    icon: IconWallet,
    title: 'شارژ حساب',
    description: 'کیف پول تومانی خود را از طریق درگاه بانکی شارژ کنید.',
  },
  {
    icon: IconCoins,
    title: 'خرید طلا',
    description: 'با هر مبلغی طلای آب‌شده ۱۸ عیار بخرید — بدون اجرت ساخت.',
  },
  {
    icon: IconTrendingUp,
    title: 'مدیریت، فروش و تحویل',
    description: 'دارایی خود را پیگیری کنید، بفروشید یا به‌صورت فیزیکی تحویل بگیرید.',
  },
]

// ---------- بخش‌های ویژگی محصول ----------
export interface FeatureBulletItem {
  icon: TablerIcon
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
      { icon: IconCoins, text: 'خرید طلای ۱۸ عیار با هر مبلغی — حتی میلی‌گرمی' },
      { icon: IconArrowsLeftRight, text: 'فروش آنی و تبدیل به تومان در هر لحظه' },
      { icon: IconRosetteDiscountCheck, text: 'بدون اجرت ساخت و بدون واسطه' },
      { icon: IconReceipt, text: 'کارمزد شفاف قبل از هر تراکنش' },
    ],
    cta: { href: '/register', label: 'شروع خرید طلا' },
    visual: 'buy',
  },
  {
    id: 'investment',
    eyebrow: 'سرمایه‌گذاری',
    title: 'سرمایه‌گذاری روی طلا، تورم‌زدا و بلندمدت',
    description:
      'طلای خود را نگه دارید یا در طرح‌های سوددهی طلایی شرکت کنید. سود شما به‌صورت طلا محاسبه می‌شود، نه تومان.',
    bullets: [
      { icon: IconTrendingUp, text: 'طرح‌های سرمایه‌گذاری با سود طلایی' },
      { icon: IconLock, text: 'طلای شما جدا و متناظر با خزانه نگهداری می‌شود' },
      { icon: IconFileSearch, text: 'تاریخچه کامل دارایی قابل پیگیری است' },
      { icon: IconPackage, text: 'امکان تحویل فیزیکی در پایان طرح' },
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
      { icon: IconCalendarClock, text: 'طرح‌های ۱۲، ۱۸ و ۲۴ ماهه' },
      { icon: IconShieldCheck, text: 'بدون نیاز به چک در اعتبارسنجی داخلی' },
      { icon: IconCoins, text: 'طلا پس از تسویه به کیف پول شما اضافه می‌شود' },
      { icon: IconReceipt, text: 'مبلغ هر قسط از ابتدا مشخص است' },
    ],
    cta: { href: '/register', label: 'خرید قسطی طلا' },
    visual: 'installment',
  },
]

// ---------- تحویل فیزیکی ----------
export const DELIVERY_BULLETS: FeatureBulletItem[] = [
  { icon: IconPackage, text: 'ثبت درخواست تحویل از پنل کاربری' },
  { icon: IconShieldCheck, text: 'بسته‌بندی امن و بیمه‌شده' },
  { icon: IconReceipt, text: 'فاکتور رسمی همراه مرسوله' },
  { icon: IconRosetteDiscountCheck, text: 'تضمین اصالت طلای تحویلی' },
  { icon: IconTruck, text: 'ارسال به آدرس شما پس از تکمیل احراز هویت' },
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
  { icon: IconBuildingBank, label: 'پشتوانه طلای فیزیکی' },
  { icon: IconFileSearch, label: 'دفتر کل قابل حسابرسی' },
  { icon: IconShieldCheck, label: 'احراز هویت چندمرحله‌ای' },
  { icon: IconLock, label: 'رمزنگاری داده‌ها' },
]

// ---------- آمار (صفحه درباره) ----------
// فقط قابلیت‌های واقعی محصول — هیچ عدد استفاده/کاربران ساختگی (Fake Social Proof ممنوع)
export interface Stat {
  value: string
  label: string
  icon: TablerIcon
}

export const STATS: Stat[] = [
  { icon: IconCoins, value: 'با هر مبلغی', label: 'خرید طلا — حتی میلی‌گرمی' },
  { icon: IconArrowsLeftRight, value: '۲۴/۷', label: 'معامله آنلاین' },
  { icon: IconFileSearch, value: '۱۰۰٪', label: 'شفافیت دفتر کل' },
  { icon: IconShieldCheck, value: '۴ سطح', label: 'احراز هویت چندمرحله‌ای' },
]
