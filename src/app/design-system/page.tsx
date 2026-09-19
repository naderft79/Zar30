// ============================================
// Zar30 - Design System Preview (/design-system)
// ============================================
// صفحه preview داخلی برای Design System فاز 3.1 — noindex، فقط توسعه/بازبینی
// ============================================

import type { Metadata } from 'next'
import { DesignSystemPreview } from './preview'

export const metadata: Metadata = {
  title: 'Design System',
  robots: { index: false, follow: false },
}

export default function DesignSystemPage() {
  return <DesignSystemPreview />
}
