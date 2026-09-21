// ============================================
// Zar30 - Gold Visuals (Landing SVG)
// ============================================
// ویژوال‌های اختصاصی برند — شمش، سکه و نمودار
// فقط SVG رسم‌شده با پالت زرسی (navy/gold)؛ بدون asset خارجی
// ============================================

import { cn } from 'cn'

const gradientDefs = (
  <defs>
    <linearGradient id="zar-bar" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#e8d48a" />
      <stop offset="45%" stopColor="#c9a227" />
      <stop offset="100%" stopColor="#8a6d15" />
    </linearGradient>
    <linearGradient id="zar-bar-top" x1="0" y1="0" x2="1" y2="0.5">
      <stop offset="0%" stopColor="#f5e6ac" />
      <stop offset="100%" stopColor="#d4af37" />
    </linearGradient>
    <linearGradient id="zar-bar-side" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#a0801c" />
      <stop offset="100%" stopColor="#6b5510" />
    </linearGradient>
    <linearGradient id="zar-coin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#f0e0ac" />
      <stop offset="55%" stopColor="#c9a227" />
      <stop offset="100%" stopColor="#a0801c" />
    </linearGradient>
  </defs>
)

function Bar({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="40,56 180,56 162,20 58,20" fill="url(#zar-bar-top)" />
      <polygon points="40,56 180,56 180,102 40,102" fill="url(#zar-bar)" />
      <polygon points="180,56 162,20 162,66 180,102" fill="url(#zar-bar-side)" />
      <text x="110" y="86" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#4a3a08">
        {label}
      </text>
    </g>
  )
}

/** شمش‌های طلای چیده‌شده — ویژوال خرید و فروش */
export function GoldBarsVisual({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 320"
      fill="none"
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label="شمش‌های طلای ۱۸ عیار"
    >
      {gradientDefs}
      <ellipse cx="210" cy="296" rx="168" ry="14" fill="#101d38" opacity="0.07" />
      <Bar x={150} y={170} label="۱۸ عیار" />
      <Bar x={76} y={112} label="ZAR30" />
      <Bar x={10} y={54} label="۷۵۰٫۰" />
      <g transform="translate(344 40)">
        <circle cx="28" cy="28" r="27" fill="url(#zar-coin)" />
        <circle
          cx="28"
          cy="28"
          r="21"
          fill="none"
          stroke="#4a3a08"
          strokeWidth="1.4"
          opacity="0.5"
        />
        <path
          d="M20 18h16l-10 14h11"
          stroke="#4a3a08"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      <g transform="translate(300 232)">
        <circle cx="22" cy="22" r="21" fill="url(#zar-coin)" />
        <circle
          cx="22"
          cy="22"
          r="16"
          fill="none"
          stroke="#4a3a08"
          strokeWidth="1.2"
          opacity="0.5"
        />
        <path
          d="M16 15h12l-7.5 10h8"
          stroke="#4a3a08"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  )
}

/** نمودار رشد + سکه — ویژوال سرمایه‌گذاری */
export function InvestmentVisual({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 320"
      fill="none"
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label="رشد ارزش دارایی طلایی"
    >
      {gradientDefs}
      <ellipse cx="210" cy="298" rx="170" ry="12" fill="#101d38" opacity="0.07" />

      {/* کارت نمودار */}
      <g>
        <rect x="20" y="40" width="320" height="220" rx="16" fill="#ffffff" stroke="#c7d4e8" />
        <rect x="20" y="40" width="320" height="36" rx="16" fill="#f7f0dd" />
        <circle cx="46" cy="58" r="5" fill="#c9a227" opacity="0.7" />
        <circle cx="64" cy="58" r="5" fill="#c9a227" opacity="0.45" />
        <circle cx="82" cy="58" r="5" fill="#c9a227" opacity="0.25" />
        <rect x="220" y="50" width="104" height="16" rx="8" fill="#e2e7f1" />

        {/* خط رشد طلایی */}
        <path
          d="M48 230 C 90 210, 110 196, 150 186 S 220 168, 260 138 S 300 106, 316 78"
          stroke="url(#zar-bar)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* سطح زیر خط */}
        <path
          d="M48 230 C 90 210, 110 196, 150 186 S 220 168, 260 138 S 300 106, 316 78 L 316 244 L 48 244 Z"
          fill="#c9a227"
          opacity="0.08"
        />
        {/* نقاط */}
        <circle cx="150" cy="186" r="5" fill="#c9a227" />
        <circle cx="260" cy="138" r="5" fill="#c9a227" />
        <circle cx="316" cy="78" r="6" fill="#c9a227" stroke="#ffffff" strokeWidth="2.5" />
        {/* خطوط راهنمای افقی */}
        <line x1="48" y1="140" x2="312" y2="140" stroke="#c7d4e8" strokeDasharray="4 6" />
        <line x1="48" y1="90" x2="312" y2="90" stroke="#c7d4e8" strokeDasharray="4 6" />
      </g>

      {/* سکه‌های شناور */}
      <g transform="translate(342 216)">
        <circle cx="34" cy="34" r="33" fill="url(#zar-coin)" />
        <circle
          cx="34"
          cy="34"
          r="26"
          fill="none"
          stroke="#4a3a08"
          strokeWidth="1.6"
          opacity="0.5"
        />
        <path
          d="M24 22h20l-12.5 17H45"
          stroke="#4a3a08"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      <g transform="translate(28 268)">
        <circle cx="20" cy="20" r="19" fill="url(#zar-coin)" />
        <circle
          cx="20"
          cy="20"
          r="14"
          fill="none"
          stroke="#4a3a08"
          strokeWidth="1.2"
          opacity="0.5"
        />
      </g>
    </svg>
  )
}

/** تقویم اقساط + سکه — ویژوال خرید قسطی */
export function InstallmentVisual({ className }: { className?: string }) {
  const cells = [
    [1, 0, 1, 0],
    [0, 1, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 0, 0],
  ]
  return (
    <svg
      viewBox="0 0 420 320"
      fill="none"
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label="تقویم پرداخت اقساط طلا"
    >
      {gradientDefs}
      <ellipse cx="200" cy="298" rx="160" ry="12" fill="#101d38" opacity="0.07" />

      {/* کارت تقویم */}
      <g>
        <rect x="36" y="36" width="300" height="232" rx="16" fill="#ffffff" stroke="#c7d4e8" />
        <rect x="36" y="36" width="300" height="44" rx="16" fill="#101d38" />
        <rect x="52" y="50" width="86" height="16" rx="8" fill="#5a76ad" />
        {/* روزهای هفته */}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={`h-${i}`}
            x={56 + i * 52}
            y="94"
            width="36"
            height="10"
            rx="5"
            fill="#e2e7f1"
          />
        ))}
        {/* خانه‌های اقساط — پرداخت‌شده طلایی */}
        {cells.flatMap((row, r) =>
          row.map((paid, c) => (
            <rect
              key={`c-${r}-${c}`}
              x={56 + c * 52}
              y={116 + r * 34}
              width="36"
              height="26"
              rx="7"
              fill={paid ? '#c9a227' : '#eef1f7'}
              opacity={paid ? 1 : 1}
            />
          )),
        )}
        {/* نوار پیشرفت */}
        <rect x="56" y="256" width="132" height="8" rx="4" fill="#e2e7f1" />
        <rect x="56" y="256" width="88" height="8" rx="4" fill="#c9a227" />
      </g>

      {/* سکه */}
      <g transform="translate(336 200)">
        <circle cx="38" cy="38" r="37" fill="url(#zar-coin)" />
        <circle
          cx="38"
          cy="38"
          r="29"
          fill="none"
          stroke="#4a3a08"
          strokeWidth="1.8"
          opacity="0.5"
        />
        <path
          d="M27 24h22l-13.5 19H50"
          stroke="#4a3a08"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
      {/* شمش کوچک */}
      <g transform="translate(318 82) scale(0.42)">
        <Bar x={0} y={0} label="۱۸" />
      </g>
    </svg>
  )
}

/** لوکاپ بر اساس نوع ویژوال */
export function GoldVisual({
  variant,
  className,
}: {
  variant: 'buy' | 'investment' | 'installment'
  className?: string
}) {
  if (variant === 'investment') return <InvestmentVisual className={className} />
  if (variant === 'installment') return <InstallmentVisual className={className} />
  return <GoldBarsVisual className={className} />
}
