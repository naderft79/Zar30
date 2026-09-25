// ============================================
// Zar30 - Theme Provider (دارک مود)
// ============================================
// مدیریت تم با next-themes — سبک و انیمیشنی
// ============================================

'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
