// ============================================
// Zar30 - Admin Search mergeSearchGroups Unit Tests
// ============================================
// ادغام round-robin قطعی — representation همه categoryها در محدوده limit
// ============================================

import { describe, expect, it } from 'vitest'
import { mergeSearchGroups, type AdminSearchResult } from '@/lib/services/admin-search.service'

function makeResult(type: AdminSearchResult['type'], n: number): AdminSearchResult {
  return {
    type,
    id: `${type}-${n}`,
    label: `${type} ${n}`,
    description: '',
    href: `/admin/${type}/${n}`,
  }
}

function makeGroup(type: AdminSearchResult['type'], count: number): AdminSearchResult[] {
  return Array.from({ length: count }, (_, i) => makeResult(type, i + 1))
}

const TYPES: AdminSearchResult['type'][] = [
  'user',
  'kyc',
  'order',
  'transaction',
  'ticket',
  'audit',
]

describe('mergeSearchGroups', () => {
  it('۶ گروه × ۵ و limit 25 → هر type حداقل یک نتیجه و total 25', () => {
    const groups = TYPES.map((t) => makeGroup(t, 5))
    const merged = mergeSearchGroups(groups, 25)
    expect(merged).toHaveLength(25)
    for (const t of TYPES) {
      expect(merged.some((r) => r.type === t)).toBe(true)
    }
  })

  it('round اول دقیقاً به ترتیب گروه‌ها است', () => {
    const groups = TYPES.map((t) => makeGroup(t, 3))
    const merged = mergeSearchGroups(groups)
    expect(merged.slice(0, 6).map((r) => r.id)).toEqual([
      'user-1',
      'kyc-1',
      'order-1',
      'transaction-1',
      'ticket-1',
      'audit-1',
    ])
  })

  it('گروه‌های خالی و ناهم‌طول امن هستند', () => {
    const merged = mergeSearchGroups([
      makeGroup('user', 0),
      makeGroup('kyc', 2),
      makeGroup('order', 0),
      makeGroup('transaction', 4),
    ])
    expect(merged).toHaveLength(6)
    expect(merged.map((r) => r.id)).toEqual([
      'kyc-1',
      'transaction-1',
      'kyc-2',
      'transaction-2',
      'transaction-3',
      'transaction-4',
    ])
  })

  it('همه گروه‌های خالی → خروجی خالی', () => {
    expect(mergeSearchGroups([[], [], []])).toEqual([])
    expect(mergeSearchGroups([])).toEqual([])
  })

  it('limit کوچک‌تر از مجموع — cutoff در همان round جاری', () => {
    const groups = [makeGroup('user', 5), makeGroup('ticket', 5)]
    const merged = mergeSearchGroups(groups, 3)
    expect(merged).toHaveLength(3)
    expect(merged.map((r) => r.id)).toEqual(['user-1', 'ticket-1', 'user-2'])
  })
})
