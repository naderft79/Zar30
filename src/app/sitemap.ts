// ============================================
// Zar30 - Sitemap
// ============================================
// نقشه سایت — صفحات عمومی قابل ایندکس
// ============================================

import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://zar30.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/about', '/security', '/faq', '/contact', '/blog', '/terms', '/privacy']

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))
}
