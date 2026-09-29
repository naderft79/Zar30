// ============================================
// Zar30 - Onboarding Animated Illustrations
// ============================================
// ویژوال‌های کارتونی هر اسکرین — فقط transform/opacity برای performance
// همه SVGها inline و کنترل‌شده با CSS هستند
// ============================================

import { cn } from '@/lib/utils/utils'

const fillGold = 'fill-gold-500'
const fillGoldLight = 'fill-gold-300'

// المان کمکی: دایره تزئینی پس‌زمینه
function Orbit({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 rounded-full border border-dashed opacity-40',
        className,
      )}
      aria-hidden="true"
    />
  )
}

// اسکرین ۱: صندوق امن طلا + شیلد
export function SecurityIllustration({ className }: { className?: string }) {
  return (
    <div className={cn('relative mx-auto size-56 sm:size-72', className)}>
      <Orbit className="border-gold-400/30 animate-spin-slow m-4" />
      <Orbit className="border-navy-300/20 animate-spin-reverse m-10" />

      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden="true">
        {/* شیلد پس‌زمینه */}
        <g className="animate-pulse-soft origin-center">
          <path
            d="M100 20 L160 45 V105 C160 145 100 180 100 180 C100 180 40 145 40 105 V45 Z"
            className="fill-navy-700/20 stroke-gold-400/40"
            strokeWidth="2"
          />
        </g>

        {/* صندوق */}
        <g className="animate-float">
          <rect
            x="55"
            y="70"
            width="90"
            height="75"
            rx="12"
            className="fill-navy-800 stroke-gold-500"
            strokeWidth="2"
          />
          <rect x="70" y="90" width="60" height="35" rx="6" className={fillGold} />
          <circle cx="100" cy="107.5" r="6" className="fill-navy-900" />
          <rect x="92" y="104" width="16" height="7" rx="1" className={fillGoldLight} />
        </g>

        {/* چشمک شیلد */}
        <g className="animate-scale-in origin-[100px_55px]">
          <path
            d="M100 38 L140 55 V100 C140 130 100 155 100 155 C100 155 60 130 60 100 V55 Z"
            className="fill-gold-500/15 stroke-gold-400"
            strokeWidth="2.5"
          />
          <path
            d="M92 88 L100 96 L114 78"
            className="stroke-gold-500"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  )
}

// اسکرین ۲: خرید/فروش آنی — نمودار + سکه
export function TradeIllustration({ className }: { className?: string }) {
  return (
    <div className={cn('relative mx-auto size-56 sm:size-72', className)}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden="true">
        {/* نمودار رشد */}
        <g transform="translate(25, 55)">
          <rect x="0" y="0" width="150" height="100" rx="10" className="fill-navy-800/30" />
          <polyline
            points="15,85 45,70 75,75 105,45 135,25"
            className="stroke-gold-500"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="135" cy="25" r="4" className="fill-gold-500 animate-pulse-soft" />
          {/* میله‌ها */}
          <rect x="25" y="55" width="8" height="30" rx="2" className="fill-navy-400/50" />
          <rect x="55" y="40" width="8" height="45" rx="2" className="fill-navy-400/50" />
          <rect x="85" y="50" width="8" height="35" rx="2" className="fill-navy-400/50" />
          <rect x="115" y="25" width="8" height="60" rx="2" className="fill-gold-400/70" />
        </g>

        {/* سکه طلا */}
        <g className="animate-coin-flip origin-[150px_150px]">
          <circle cx="150" cy="150" r="28" className={fillGold} />
          <circle
            cx="150"
            cy="150"
            r="22"
            className="stroke-gold-700"
            strokeWidth="1.5"
            fill="none"
          />
          <text
            x="150"
            y="157"
            textAnchor="middle"
            className="fill-navy-900 text-[18px] font-bold"
            style={{ fontFamily: 'inherit' }}
          >
            Au
          </text>
        </g>

        {/* سکه کوچک */}
        <g className="animate-coin-flop origin-[45px_160px]">
          <circle cx="45" cy="160" r="18" className={fillGoldLight} />
          <text
            x="45"
            y="166"
            textAnchor="middle"
            className="fill-navy-900 text-[12px] font-bold"
            style={{ fontFamily: 'inherit' }}
          >
            Au
          </text>
        </g>
      </svg>
    </div>
  )
}

// اسکرین ۳: سرمایه‌گذاری/قسطی — تقویم + نمودار رشد
export function InvestIllustration({ className }: { className?: string }) {
  return (
    <div className={cn('relative mx-auto size-56 sm:size-72', className)}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden="true">
        {/* تقویم */}
        <g transform="translate(35, 40)">
          <rect x="0" y="0" width="90" height="90" rx="10" className="fill-navy-800" />
          <rect x="0" y="0" width="90" height="24" rx="10" className="fill-gold-500" />
          <rect x="0" y="14" width="90" height="76" rx="10" className="fill-navy-800" />
          <text
            x="45"
            y="17"
            textAnchor="middle"
            className="fill-navy-900 text-[10px] font-bold"
            style={{ fontFamily: 'inherit' }}
          >
            خرید قسطی
          </text>
          {/* روزهای تقویم */}
          {[
            { x: 12, y: 42 },
            { x: 36, y: 42 },
            { x: 60, y: 42 },
            { x: 12, y: 66 },
            { x: 36, y: 66 },
            { x: 60, y: 66 },
          ].map((p, i) => (
            <rect
              key={i}
              x={p.x}
              y={p.y}
              width="18"
              height="16"
              rx="3"
              className={i === 4 ? 'fill-gold-500' : 'fill-navy-600'}
            />
          ))}
        </g>

        {/* نمودار رشد */}
        <g transform="translate(115, 95)">
          <rect x="0" y="0" width="55" height="70" rx="8" className="fill-gold-100" />
          <polyline
            points="10,58 20,45 30,48 40,32 48,18"
            className="stroke-gold-600"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="48" cy="18" r="3" className="fill-gold-600 animate-pulse-soft" />
        </g>

        {/* برگ‌های رشد */}
        <g className="animate-grow origin-[70px_155px]">
          <path d="M70 155 C60 140 55 125 70 115 C85 125 80 140 70 155" className="fill-gold-400" />
          <path
            d="M70 155 Q60 145 55 150"
            className="stroke-gold-600"
            strokeWidth="1.5"
            fill="none"
          />
        </g>
      </svg>
    </div>
  )
}

// اسکرین ۴: تحویل فیزیکی/کیف پول
export function DeliveryIllustration({ className }: { className?: string }) {
  return (
    <div className={cn('relative mx-auto size-56 sm:size-72', className)}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden="true">
        {/* کیف پول */}
        <g transform="translate(30, 60)">
          <rect x="0" y="0" width="85" height="60" rx="10" className="fill-navy-800" />
          <rect x="10" y="8" width="65" height="12" rx="3" className="fill-gold-500" />
          <circle cx="75" cy="30" r="6" className="fill-gold-400" />
          <text
            x="42"
            y="50"
            textAnchor="middle"
            className="fill-cream-100 text-[10px] font-medium"
            style={{ fontFamily: 'inherit' }}
          >
            کیف پول زرسی
          </text>
        </g>

        {/* بسته فیزیکی */}
        <g className="animate-float" transform="translate(95, 80)">
          <rect x="0" y="0" width="75" height="75" rx="8" className="fill-gold-100" />
          <rect x="0" y="33" width="75" height="9" className="fill-gold-500" />
          <rect x="33" y="0" width="9" height="75" className="fill-gold-500" />
          <circle cx="37.5" cy="37.5" r="10" className="fill-navy-800" />
          <path
            d="M32 37.5 L35 41 L44 33"
            className="stroke-gold-400"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* نشان امن */}
        <g className="animate-scale-in origin-[45px_150px]">
          <circle cx="45" cy="150" r="18" className="fill-gold-500" />
          <path
            d="M38 148 L44 155 L55 142"
            className="stroke-navy-900"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  )
}
