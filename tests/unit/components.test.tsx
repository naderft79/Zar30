// @vitest-environment jsdom
// ============================================
// Zar30 - Component Tests
// ============================================
// تست کامپوننت‌های کلیدی Design System
// ============================================

import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Logo } from '@/components/shared/logo'
import { Section } from '@/components/shared/section'
import { Container } from '@/components/shared/container'

afterEach(cleanup)

describe('Logo', () => {
  it('نام برند را نمایش می‌دهد', () => {
    render(<Logo />)
    expect(screen.getByText('زرسی')).toBeTruthy()
  })

  it('بدون متن هم قابل رندر است', () => {
    const { container } = render(<Logo showText={false} />)
    expect(container.querySelector('svg')).toBeTruthy()
    expect(screen.queryByText('زرسی')).toBeNull()
  })
})

describe('Section', () => {
  it('عنوان و توضیحات را رندر می‌کند', () => {
    render(
      <Section title="عنوان تست" description="توضیح تست">
        <div>محتوا</div>
      </Section>,
    )
    expect(screen.getByText('عنوان تست')).toBeTruthy()
    expect(screen.getByText('توضیح تست')).toBeTruthy()
    expect(screen.getByText('محتوا')).toBeTruthy()
  })

  it('عنوان را به‌صورت معنایی (heading) رندر می‌کند', () => {
    render(<Section title="سکشن">x</Section>)
    expect(screen.getByRole('heading', { name: 'سکشن' })).toBeTruthy()
  })
})

describe('Container', () => {
  it('فرزندان را داخل wrapper رندر می‌کند', () => {
    render(
      <Container>
        <span>داخل کانتینر</span>
      </Container>,
    )
    expect(screen.getByText('داخل کانتینر')).toBeTruthy()
  })
})
