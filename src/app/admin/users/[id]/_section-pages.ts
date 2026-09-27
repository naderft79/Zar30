// ============================================
// Zar30 - User Subpage Factory
// ============================================
// همه صفحات /admin/users/[id]/<section> از این factory ساخته می‌شوند
// static export سازگار: generateStaticParams با id='_'
// ============================================

import type { Metadata } from 'next'

export function makeUserSectionPage(title: string, render: () => React.ReactNode) {
  function Page() {
    return render()
  }
  Page.metadata = { title } as unknown as Metadata
  return Page
}

export const USER_SECTION_STATIC_PARAMS = () => [{ id: '_' }]
