// ============================================
// Zarnama - Landing Data Tests
// ============================================
// صحت‌سنجی ساختار داده‌های صفحه اصلی
// ============================================

import { describe, expect, it } from 'vitest'
import { FAQS, NAV_LINKS, FEATURES, HOW_IT_WORKS, STATS } from '@/lib/data/landing'

describe('Landing Data', () => {
  it('NAV_LINKS به صفحات عمومی معتبر اشاره می‌کند', () => {
    expect(NAV_LINKS.length).toBeGreaterThan(0)
    for (const link of NAV_LINKS) {
      expect(link.href).toMatch(/^\//)
      expect(link.label.length).toBeGreaterThan(0)
    }
  })

  it('FAQS ساختار Question/Answer معتبر دارد', () => {
    expect(FAQS.length).toBeGreaterThanOrEqual(4)
    for (const faq of FAQS) {
      expect(faq.question.trim().length).toBeGreaterThan(5)
      expect(faq.answer.trim().length).toBeGreaterThan(10)
    }
  })

  it('FEATURES حداقل ۶ آیتم دارد', () => {
    expect(FEATURES.length).toBeGreaterThanOrEqual(6)
    for (const f of FEATURES) {
      expect(f.title.length).toBeGreaterThan(0)
      expect(f.description.length).toBeGreaterThan(0)
    }
  })

  it('HOW_IT_WORKS ترتیب مراحل را دارد', () => {
    expect(HOW_IT_WORKS.length).toBeGreaterThanOrEqual(4)
  })

  it('STATS مقادیر نمایشی دارد', () => {
    expect(STATS.length).toBeGreaterThanOrEqual(3)
  })
})
