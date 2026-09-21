// ============================================
// Zar30 - Feature Bullet (Landing)
// ============================================
// بولت ویژگی — icon + text با hover بسیار ملایم
// ============================================

import type { FeatureBulletItem } from '@/lib/data/landing'

export function FeatureBullet({ icon: Icon, text }: FeatureBulletItem) {
  return (
    <li className="group flex items-start gap-3">
      <span className="bg-cream-100 text-gold-600 mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-[1.05]">
        <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
      </span>
      <span className="text-navy-700 group-hover:text-navy-900 text-sm leading-7 transition-colors">
        {text}
      </span>
    </li>
  )
}
