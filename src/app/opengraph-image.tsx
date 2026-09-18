// ============================================
// Zarnama - OpenGraph Image
// ============================================
// تصویر اشتراک‌گذاری — در زمان build تولید می شود
// نکته: satori از shaping پیچیده فارسی پشتیبانی نمی کند،
// بنابراین متن لاتین استفاده می شود.
// ============================================

import { ImageResponse } from 'next/og'

export const alt = 'ZarNama — Buy, Sell & Invest in 18K Gold'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f1a33 0%, #1a2a4f 50%, #24355f 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* نماد سکه طلا */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e0c25a 0%, #c9a227 50%, #a0801c 100%)',
            marginBottom: 40,
            fontSize: 76,
            fontWeight: 800,
            color: '#0f1a33',
          }}
        >
          Z
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            color: '#f5ecd7',
            marginBottom: 16,
            letterSpacing: 2,
          }}
        >
          ZarNama
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#c9a227',
          }}
        >
          Buy, Sell &amp; Invest in 18K Gold
        </div>
      </div>
    ),
    { ...size },
  )
}
