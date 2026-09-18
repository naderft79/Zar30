// ============================================
// Zarnama - Robots
// ============================================
// صفحات عمومی قابل ایندکس — auth و API محروم
// ============================================

import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://zarnama.ir'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/login', '/register', '/dashboard', '/admin'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
