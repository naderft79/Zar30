// ============================================
// Zar30 - Serwist Service Worker Route
// ============================================
// این route به‌صورت on-demand service worker را می سازد
// سازگار با Turbopack
// ============================================

import { createSerwistRoute } from '@serwist/turbopack'

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute(
  {
    swSrc: 'src/sw.ts',
    // در development از esbuild-wasm استفاده می کنیم
    useNativeEsbuild: true,
  },
)
