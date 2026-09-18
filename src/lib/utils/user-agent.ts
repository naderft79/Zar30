// ============================================
// Zarnama - تجزیه User-Agent (نمایش نشست‌ها)
// ============================================
// تجزیه سبک heuristic — فقط برچسب کلی device/os/browser
// در صورت عدم تشخیص "unknown" برمی‌گرداند و هرگز throw نمی‌کند
// ============================================

export interface DeviceInfo {
  device: string // desktop / mobile / tablet / unknown
  os: string // Windows / macOS / Linux / Android / iOS / unknown
  browser: string // Chrome / Firefox / Safari / Edge / curl / unknown
}

// heuristic سبک — فقط برای نمایش لیست نشست‌ها، نه پوشش کامل کتابخانه UA
export function parseUserAgent(ua: string): DeviceInfo {
  const info: DeviceInfo = { device: 'unknown', os: 'unknown', browser: 'unknown' }
  if (!ua) return info

  // ---- سیستم‌عامل ----
  if (ua.includes('Windows')) info.os = 'Windows'
  else if (ua.includes('Android')) info.os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) info.os = 'iOS'
  else if (ua.includes('Mac OS') || ua.includes('Macintosh')) info.os = 'macOS'
  else if (ua.includes('Linux')) info.os = 'Linux'

  // ---- نوع دستگاه ----
  // iPad UA واقعی شامل "Mobile/" است — تبلت باید قبل از موبایل بررسی شود
  // تبلت‌های Android معمولاً "Mobile" ندارند
  if (
    ua.includes('iPad') ||
    ua.includes('Tablet') ||
    (ua.includes('Android') && !ua.includes('Mobile'))
  ) {
    info.device = 'tablet'
  } else if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    info.device = 'mobile'
  } else if (info.os !== 'unknown') {
    info.device = 'desktop'
  }

  // ---- مرورگر (ترتیب مهم: Edge شامل Chrome و Chrome شامل Safari است) ----
  if (ua.includes('Edg/') || ua.includes('Edge/')) info.browser = 'Edge'
  else if (ua.includes('Firefox/')) info.browser = 'Firefox'
  else if (ua.includes('Chrome/')) info.browser = 'Chrome'
  else if (ua.includes('Safari/')) info.browser = 'Safari'
  else if (ua.includes('curl/')) info.browser = 'curl'

  return info
}
