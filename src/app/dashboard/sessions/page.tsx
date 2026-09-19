// مسیر قدیمی — انتقال یافته به /dashboard/profile/sessions
import { redirect } from 'next/navigation'

export default function SessionsRedirect() {
  redirect('/dashboard/profile/sessions')
}
