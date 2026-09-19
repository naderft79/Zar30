// مسیر قدیمی — انتقال یافته به /dashboard/profile/support
import { redirect } from 'next/navigation'

export default function SupportRedirect() {
  redirect('/dashboard/profile/support')
}
