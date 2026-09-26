// ============================================
// Zar30 - Admin Roles & Members Client
// ============================================
// ماتریس نقش → permission + ویرایش نقش/فعلیت/override اعضا
// ============================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import { IconPencil, IconShieldCheck } from '@tabler/icons-react'
import { apiGetWithRefresh, apiPut } from '@/lib/api/client'
import { toPersianDigits } from '@/lib/utils/format'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatus } from '@/components/admin/admin-status'
import { AdminFinanceList } from '@/components/admin/finance-list'
import {
  AdminFormDialog,
  type AdminFormField,
  type AdminFormValues,
} from '@/components/admin/admin-form-dialog'

interface RoleRow {
  role: string
  label: string
  permissions: string[]
  count: number
}

interface MemberRow {
  id: string
  role: string
  active: boolean
  createdAt: string
  user: { id: string; mobile: string; firstName: string | null; lastName: string | null }
}

const ROLE_OPTIONS = [
  'SUPER_ADMIN',
  'FINANCE',
  'SUPPORT',
  'KYC',
  'RISK',
  'CONTENT',
  'OPERATIONS',
  'ANALYST',
  'READ_ONLY',
].map((v) => ({ value: v, label: v }))

const MEMBER_FIELDS: AdminFormField[] = [
  { key: 'role', label: 'نقش', type: 'select', options: ROLE_OPTIONS },
  { key: 'active', label: 'فعال', type: 'checkbox' },
  {
    key: 'grant',
    label: 'دسترسی‌های اضافه (grant)',
    ltr: true,
    hint: 'permissionهای اضافه روی نقش — با کاما جدا کنید؛ مثل withdrawals.approve',
  },
  {
    key: 'revoke',
    label: 'دسترسی‌های محروم (revoke)',
    ltr: true,
    hint: 'permissionهایی که از نقش کم می‌شوند — با کاما جدا کنید',
  },
  { key: 'reason', label: 'دلیل تغییر', required: true, hint: 'در audit ثبت می‌شود' },
]

export function AdminRolesClient() {
  const [roles, setRoles] = useState<RoleRow[] | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [memberDialog, setMemberDialog] = useState(false)
  const [editingMember, setEditingMember] = useState<MemberRow | null>(null)
  const [memberDetail, setMemberDetail] = useState<{
    grant: string[]
    revoke: string[]
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await apiGetWithRefresh<{ roles: RoleRow[] }>('/api/v1/admin/roles')
      if (!cancelled && res.ok && res.data?.roles) setRoles(res.data.roles)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const openMember = useCallback(async (m: MemberRow) => {
    const res = await apiGetWithRefresh<{ member: { grant: string[]; revoke: string[] } }>(
      `/api/v1/admin/team/${m.id}`,
    )
    setEditingMember(m)
    setMemberDetail(res.ok && res.data?.member ? res.data.member : { grant: [], revoke: [] })
    setMemberDialog(true)
  }, [])

  const submitMember = useCallback(
    async (values: AdminFormValues): Promise<string | null> => {
      if (!editingMember) return 'عضو انتخاب نشده است'
      const res = await apiPut(`/api/v1/admin/team/${editingMember.id}`, {
        role: String(values.role ?? editingMember.role),
        active: values.active === true,
        grant: String(values.grant ?? '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
        revoke: String(values.revoke ?? '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
        reason: String(values.reason ?? ''),
      })
      if (!res.ok) return res.error ?? 'ذخیره ناموفق بود'
      setRefreshKey((k) => k + 1)
      return null
    },
    [editingMember],
  )

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="نقش‌ها و دسترسی‌ها"
        eyebrow="مدیریت سیستم"
        description="نقش‌ها از کد (least privilege) خوانده می‌شوند؛ overrideها روی هر عضو به‌صورت grant/revoke اعمال و audit می‌شوند"
      />

      {/* ===== ماتریس نقش‌ها ===== */}
      {!roles ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <div key={r.role} className="bg-card border-border/60 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IconShieldCheck className="text-gold-500 size-4" aria-hidden="true" />
                  <p className="text-sm font-bold">{r.label}</p>
                </div>
                <span className="text-muted-foreground text-[10px] tabular-nums" dir="ltr">
                  {r.role}
                </span>
              </div>
              <p className="text-muted-foreground mt-2 text-[11px]">
                {toPersianDigits(r.count)} permission
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {r.permissions.slice(0, 6).map((p) => (
                  <span
                    key={p}
                    className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[9px]"
                    dir="ltr"
                  >
                    {p}
                  </span>
                ))}
                {r.permissions.length > 6 && (
                  <span className="text-muted-foreground text-[9px]">
                    +{toPersianDigits(r.permissions.length - 6)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== اعضا ===== */}
      <AdminFinanceList<MemberRow>
        title="اعضای تیم"
        titleAs="h2"
        endpoint="/api/v1/admin/team"
        dataKey="admins"
        keyOf={(m) => m.id}
        searchPlaceholder="نام یا موبایل…"
        refreshKey={refreshKey}
        columns={[
          {
            key: 'user',
            header: 'عضو',
            render: (m) =>
              [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || m.user.mobile,
          },
          { key: 'mobile', header: 'موبایل', render: (m) => m.user.mobile },
          {
            key: 'role',
            header: 'نقش',
            render: (m) => (
              <span className="bg-gold-500/10 text-gold-700 dark:text-gold-300 rounded-md px-2 py-0.5 text-[11px] font-medium">
                {m.role}
              </span>
            ),
          },
          {
            key: 'active',
            header: 'وضعیت',
            render: (m) => <AdminStatus status={m.active ? 'ACTIVE' : 'BLOCKED'} />,
          },
          {
            key: 'created',
            header: 'عضویت',
            render: (m) => new Date(m.createdAt).toLocaleDateString('fa-IR'),
            mobile: false,
          },
        ]}
        rowActions={(m) => (
          <button
            type="button"
            aria-label="ویرایش عضو"
            title="ویرایش نقش/دسترسی"
            onClick={() => void openMember(m)}
            className="border-border/60 text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-lg border transition-colors"
          >
            <IconPencil className="size-4" aria-hidden="true" />
          </button>
        )}
        emptyMessage="عضوی یافت نشد"
      />

      <AdminFormDialog
        open={memberDialog}
        onOpenChange={setMemberDialog}
        title={
          editingMember
            ? `ویرایش «${[editingMember.user.firstName, editingMember.user.lastName].filter(Boolean).join(' ') || editingMember.user.mobile}»`
            : 'ویرایش عضو'
        }
        fields={MEMBER_FIELDS}
        initial={
          editingMember
            ? {
                role: editingMember.role,
                active: editingMember.active,
                grant: memberDetail?.grant.join(',') ?? '',
                revoke: memberDetail?.revoke.join(',') ?? '',
              }
            : undefined
        }
        onSubmit={submitMember}
      />
    </div>
  )
}
