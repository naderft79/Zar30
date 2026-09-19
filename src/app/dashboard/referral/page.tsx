// مسیر قدیمی — انتقال یافته به /dashboard/profile/referral
import { redirect } from 'next/navigation'

export default function ReferralRedirect() {
  redirect('/dashboard/profile/referral')
}
