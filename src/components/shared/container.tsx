// ============================================
// Zarnama - Container Component
// ============================================
// کانتینر مرکزی با حداکثر عرض و padding ریسپانسیو
// ============================================

import { cn } from 'cn'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
}

export function Container({ children, className, size = 'xl' }: ContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}>
      {children}
    </div>
  )
}
