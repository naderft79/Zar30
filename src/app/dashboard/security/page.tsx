// مسیر قدیمی — انتقال یافته به /dashboard/profile/security
// redirect برای سازگاری با bookmarkهای موجود
import { redirect } from 'next/navigation'

export default function SecurityRedirect() {
  redirect('/dashboard/profile/security')
}
