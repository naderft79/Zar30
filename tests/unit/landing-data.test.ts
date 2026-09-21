// ============================================
// Zar30 - Landing Data Tests
// ============================================
// صحت‌سنجی ساختار داده‌های صفحه اصلی (نسخه Gerami-style)
// ============================================

import { describe, expect, it } from 'vitest'
import {
  FAQS,
  NAV_ITEMS,
  TRUST_CARDS,
  HOW_IT_WORKS_STEPS,
  FEATURE_SECTIONS,
  FOOTER_LINKS,
} from '@/lib/data/landing'

describe('Landing Data', () => {
  it('NAV_ITEMS به صفحات/لنگرهای معتبر اشاره می‌کند', () => {
    expect(NAV_ITEMS.length).toBeGreaterThan(0)
    for (const item of NAV_ITEMS) {
      if (item.children) {
        // dropdown — آیتم‌های فرعی باید لینک معتبر داشته باشند
        expect(item.children.length).toBeGreaterThan(0)
        for (const child of item.children) {
          expect(child.href).toMatch(/^\//)
          expect(child.label.length).toBeGreaterThan(0)
        }
      } else {
        expect(item.href).toMatch(/^\//)
        expect(item.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('FAQS ساختار Question/Answer معتبر دارد', () => {
    expect(FAQS.length).toBeGreaterThanOrEqual(4)
    for (const faq of FAQS) {
      expect(faq.question.trim().length).toBeGreaterThan(5)
      expect(faq.answer.trim().length).toBeGreaterThan(10)
    }
  })

  it('TRUST_CARDS چهار کارت با متن کامل دارد', () => {
    expect(TRUST_CARDS).toHaveLength(4)
    for (const card of TRUST_CARDS) {
      expect(card.title.length).toBeGreaterThan(0)
      expect(card.description.length).toBeGreaterThan(0)
    }
  })

  it('HOW_IT_WORKS_STEPS چهار مرحله دارد', () => {
    expect(HOW_IT_WORKS_STEPS).toHaveLength(4)
    for (const step of HOW_IT_WORKS_STEPS) {
      expect(step.title.length).toBeGreaterThan(0)
      expect(step.description.length).toBeGreaterThan(0)
    }
  })

  it('FEATURE_SECTIONS سه بخش با id یکتا و CTA دارد', () => {
    expect(FEATURE_SECTIONS).toHaveLength(3)
    const ids = FEATURE_SECTIONS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const section of FEATURE_SECTIONS) {
      expect(section.bullets.length).toBeGreaterThanOrEqual(3)
      expect(section.cta.href).toMatch(/^\//)
      expect(section.visual).toBeOneOf(['buy', 'investment', 'installment'])
    }
  })

  it('FOOTER_LINKS ساختار سه ستونه معتبر دارد', () => {
    expect(FOOTER_LINKS.length).toBe(3)
    for (const group of FOOTER_LINKS) {
      expect(group.links.length).toBeGreaterThan(0)
      for (const link of group.links) {
        expect(link.href).toMatch(/^\//)
      }
    }
  })
})
