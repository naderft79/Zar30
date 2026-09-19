import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Providers } from '@/components/providers/providers'
import './globals.css'

const vazirmatn = localFont({
  src: '../../public/fonts/vazirmatn.woff2',
  variable: '--font-vazirmatn',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://zar30.com'),
  title: {
    default: 'زرسی | پلتفرم خرید و سرمایه‌گذاری طلای آب‌شده',
    template: '%s | زرسی',
  },
  description:
    'زرسی، ساده‌ترین و امن‌ترین راه برای خرید، فروش و سرمایه‌گذاری روی طلای آب‌شده ۱۸ عیار با شفافیت کامل و کارمزد کم',
  keywords: ['طلای آب‌شده', 'خرید طلا', 'فروش طلا', 'سرمایه‌گذاری طلا', 'زرسی', 'gold', 'zar30'],
  authors: [{ name: 'Zar30' }],
  openGraph: {
    title: 'زرسی | پلتفرم خرید و سرمایه‌گذاری طلای آب‌شده',
    description: 'خرید، فروش و سرمایه‌گذاری روی طلای آب‌شده با شفافیت کامل',
    type: 'website',
    locale: 'fa_IR',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'زرسی',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <body className={`${vazirmatn.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
