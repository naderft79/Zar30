import type { NextConfig } from 'next'
import { withSerwist } from '@serwist/turbopack'

// ============================================
// Zar30 - Next.js Configuration
// ============================================
// دو Target: Web (SSR) + Mobile (Capacitor static export)
// BUILD_TARGET=mobile → static export برای Capacitor
// BUILD_TARGET=web (default) → SSR build + PWA (Serwist turbopack)
// ============================================

const isMobileBuild = process.env.BUILD_TARGET === 'mobile'

const nextConfig: NextConfig = {
  reactCompiler: true,

  // دسترسی به dev server از دستگاه‌های دیگر روی LAN (موبایل روی همان Wi-Fi)
  // اگر IP لپ‌تاپ عوض شد (DHCP)، آدرس جدید را اینجا اضافه کن
  allowedDevOrigins: ['192.168.1.13'],

  // برای Mobile target → static export
  ...(isMobileBuild && {
    output: 'export' as const,
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
  }),

  // برای Web target → SSR + PWA
  ...(!isMobileBuild && {
    images: {
      remotePatterns: [
        {
          protocol: 'https' as const,
          hostname: '**',
        },
      ],
    },
  }),
}

export default isMobileBuild ? nextConfig : withSerwist(nextConfig)
