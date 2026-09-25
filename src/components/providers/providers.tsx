// ============================================
// Zar30 - Application Providers
// ============================================
// TanStack Query + Theme + Toast
// ============================================

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { ServiceWorkerRegister } from './sw-register'
import { ThemeProvider } from './theme-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  // ایجاد QueryClient یکبار در سطح کلاینت
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // داده های مالی نباید بیش از حد cache شوند
            staleTime: 30 * 1000, // 30 ثانیه
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0, // عملیات مالی نباید خودکار retry شوند
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* پیش‌فرض light — کلاس روی html؛ انتخاب در localStorage می‌ماند */}
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        storageKey="zar30-theme"
      >
        {children}
        <ServiceWorkerRegister />
        <Toaster position="top-center" richColors dir="rtl" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
