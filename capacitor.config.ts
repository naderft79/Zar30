import type { CapacitorConfig } from '@capacitor/cli'

// ============================================
// Zarnama - Capacitor Configuration
// ============================================
// Mobile Target: Android + iOS (V2)
// Build: BUILD_TARGET=mobile pnpm build → out/
// Web Target: pnpm build → .next/ (SSR)
// ============================================

const config: CapacitorConfig = {
  appId: 'ir.zarnama.app',
  appName: 'زرنما',
  webDir: 'out',
  // در development به dev server اشاره می‌کند
  server: {
    // برای dev: URL سرور توسعه — برای production حذف می شود
    ...(process.env.CAP_DEV_URL && { url: process.env.CAP_DEV_URL, cleartext: true }),
    androidScheme: 'https',
  },
  plugins: {
    // Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a2a4f', // navy
      showSpinner: false,
    },
  },
}

export default config
