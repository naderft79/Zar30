// ============================================
// Zar30 - Section Component
// ============================================
// بخش صفحه با heading اختیاری و spacing استاندارد
// ============================================

import { cn } from 'cn'
import { Container } from './container'

interface SectionProps {
  children: React.ReactNode
  id?: string
  className?: string
  containerClassName?: string
  containerSize?: 'sm' | 'md' | 'lg' | 'xl'
  eyebrow?: string
  title?: string
  titleAs?: 'h1' | 'h2'
  description?: string
  centered?: boolean
}

export function Section({
  children,
  id,
  className,
  containerClassName,
  containerSize = 'xl',
  eyebrow,
  title,
  titleAs: TitleTag = 'h2',
  description,
  centered = true,
}: SectionProps) {
  return (
    <section id={id} className={cn('py-16 sm:py-20 lg:py-24', className)}>
      <Container size={containerSize} className={containerClassName}>
        {(eyebrow || title || description) && (
          <div className={cn('mb-10 sm:mb-14', centered && 'text-center')}>
            {eyebrow && (
              <span className="text-gold mb-3 inline-block text-sm font-semibold tracking-wide">
                {eyebrow}
              </span>
            )}
            {title && (
              <TitleTag className="text-foreground text-2xl font-bold sm:text-3xl lg:text-4xl">
                {title}
              </TitleTag>
            )}
            {description && (
              <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </Container>
    </section>
  )
}
