// ============================================
// Zarnama - Gold Calculator (Client)
// ============================================
// ماشین‌حساب طلا: مبلغ ریالی ↔ گرم طلا
// از قیمت Demo استفاده می کند — صریحاً اعلام می شود
// ============================================

'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toPersianDigits, formatRial, formatGold } from '@/lib/utils/utils'
import type { GoldPrice } from '@/lib/price/types'

interface GoldCalculatorProps {
  price: GoldPrice
}

export function GoldCalculator({ price }: GoldCalculatorProps) {
  const [rialInput, setRialInput] = useState('1000000')
  const [goldInput, setGoldInput] = useState('')
  const [lastEdited, setLastEdited] = useState<'rial' | 'gold'>('rial')

  const { rialAmount, goldGrams } = useMemo(() => {
    const rial = Number(rialInput.replace(/[^0-9]/g, '')) || 0
    const gold = parseFloat(goldInput.replace(/[^0-9.]/g, '')) || 0
    if (lastEdited === 'rial') {
      return { rialAmount: rial, goldGrams: rial / price.buyPrice }
    }
    return { rialAmount: gold * price.buyPrice, goldGrams: gold }
  }, [rialInput, goldInput, lastEdited, price.buyPrice])

  return (
    <Card className="border-border/60">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-foreground font-semibold">محاسبه سریع</h3>
          {!price.isLive && (
            <Badge variant="outline" className="border-warning/50 text-warning gap-1 text-xs">
              <AlertCircle className="size-3" />
              قیمت Demo
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {/* ورودی ریال */}
          <div>
            <label htmlFor="calc-rial" className="text-muted-foreground mb-1.5 block text-sm">
              مبلغ (ریال)
            </label>
            <Input
              id="calc-rial"
              inputMode="numeric"
              dir="ltr"
              className="text-left tabular-nums"
              value={lastEdited === 'rial' ? rialInput : Math.round(rialAmount).toString()}
              onChange={(e) => {
                setRialInput(e.target.value.replace(/[^0-9]/g, ''))
                setLastEdited('rial')
              }}
              placeholder="1000000"
            />
          </div>

          {/* دکمه تعویض جهت */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="تعویض جهت محاسبه"
              onClick={() => setLastEdited(lastEdited === 'rial' ? 'gold' : 'rial')}
            >
              <ArrowUpDown className="text-gold size-4" />
            </Button>
          </div>

          {/* ورودی گرم */}
          <div>
            <label htmlFor="calc-gold" className="text-muted-foreground mb-1.5 block text-sm">
              طلا (گرم)
            </label>
            <Input
              id="calc-gold"
              inputMode="decimal"
              dir="ltr"
              className="text-left tabular-nums"
              value={lastEdited === 'gold' ? goldInput : goldGrams.toFixed(4)}
              onChange={(e) => {
                setGoldInput(e.target.value)
                setLastEdited('gold')
              }}
              placeholder="0.0000"
            />
          </div>

          {/* نتیجه */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-muted-foreground text-xs">برابر است با</p>
            <p className="text-gold mt-1 text-xl font-bold">
              {toPersianDigits(formatGold(goldGrams))} گرم طلای ۱۸ عیار
            </p>
            <p className="text-muted-foreground mt-1 text-xs" dir="ltr">
              ≈ {toPersianDigits(formatRial(Math.round(rialAmount)))} ریال
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
