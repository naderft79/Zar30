// @vitest-environment jsdom
// ============================================
// Zar30 - Admin Components Unit Tests
// ============================================
// AdminMetric semantics/tabular + AdminPageHeader heading structure
// ============================================

import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Coins } from 'lucide-react'
import { AdminMetric } from '@/components/admin/admin-metric'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

afterEach(cleanup)

describe('AdminMetric', () => {
  it('label و مقدار را با ارقام فارسی نمایش می‌دهد', () => {
    render(<AdminMetric label="کل کاربران" value={1234} />)
    expect(screen.getByText('کل کاربران')).toBeTruthy()
    expect(screen.getByText('۱۲۳۴')).toBeTruthy()
  })

  it('مقدار در کانتینر tabular-nums است', () => {
    const { container } = render(<AdminMetric label="موجودی" value="۱٬۰۰۰" />)
    const valueEl = container.querySelector('.tabular-nums')
    expect(valueEl).toBeTruthy()
    expect(valueEl!.textContent).toContain('۱٬۰۰۰')
  })

  it('واحد و hint و tone رندر می‌شوند', () => {
    render(
      <AdminMetric
        label="برداشت"
        value={5}
        unit="مورد"
        hint="در انتظار تایید"
        tone="warning"
        icon={Coins}
      />,
    )
    expect(screen.getByText('مورد')).toBeTruthy()
    expect(screen.getByText('در انتظار تایید')).toBeTruthy()
  })
})

describe('AdminPageHeader', () => {
  it('عنوان در h1 و توضیحات رندر می‌شود', () => {
    render(<AdminPageHeader title="داشبورد عملیاتی" description="نمای کلی شاخص‌ها" />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toBe('داشبورد عملیاتی')
    expect(screen.getByText('نمای کلی شاخص‌ها')).toBeTruthy()
  })

  it('eyebrow و actions اختیاری رندر می‌شوند', () => {
    render(<AdminPageHeader title="کاربران" eyebrow="مشتریان" actions={<button>افزودن</button>} />)
    expect(screen.getByText('مشتریان')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'افزودن' })).toBeTruthy()
  })
})
