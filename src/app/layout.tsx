import type { Metadata } from 'next'
import { Vazirmatn } from 'next/font/google'
import { Providers } from '@/components/providers/providers'
import './globals.css'

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'زرنما | پلتفرم خرید و سرمایه‌گذاری طلای آب‌شده',
    template: '%s | زرنما',
  },
  description:
    'زرنما، ساده‌ترین و امن‌ترین راه برای خرید، فروش و سرمایه‌گذاری روی طلای آب‌شده ۱۸ عیار با شفافیت کامل و کارمزد کم',
  keywords: ['طلای آب‌شده', 'خرید طلا', 'فروش طلا', 'سرمایه‌گذاری طلا', 'زرنما', 'gold', 'zarnama'],
  authors: [{ name: 'Zarnama' }],
  openGraph: {
    title: 'زرنما | پلتفرم خرید و سرمایه‌گذاری طلای آب‌شده',
    description: 'خرید، فروش و سرمایه‌گذاری روی طلای آب‌شده با شفافیت کامل',
    type: 'website',
    locale: 'fa_IR',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'زرنما',
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
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={`${vazirmatn.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
