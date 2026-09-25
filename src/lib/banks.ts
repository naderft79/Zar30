// ============================================
// Zar30 - Iranian Bank Directory
// ============================================
// تشخیص بانک از کد ۳ رقمی شبا (رقم‌های ۵ تا ۷ IBAN — بعد از IR و ۲ رقم کنترلی)
// هر بانک نام فارسی + گرادیانت رنگ رسمی برای رندر کارت دارد
// ============================================

import { getBankInfoWithCardNumber } from 'ir-banks-info'

export interface BankInfo {
  code: string
  name: string
  /** گرادیانت کارت — from/to و رنگ متن */
  from: string
  to: string
  text: string
  /** لوگوی رسمی بانک — data URI */
  logo?: string
}

const GENERIC = { from: '#37415c', to: '#1f2940', text: '#f3ead1' }

const BANKS: Record<string, Omit<BankInfo, 'code'>> = {
  '010': { name: 'بانک ملی ایران', from: '#0d47a1', to: '#06275e', text: '#fff' },
  '011': { name: 'بانک صنعت و معدن', from: '#4e342e', to: '#261915', text: '#fff' },
  '012': { name: 'بانک ملت', from: '#d22630', to: '#7f0e18', text: '#fff' },
  '013': { name: 'بانک رفاه کارگران', from: '#8e1f2f', to: '#4c0f18', text: '#fff' },
  '014': { name: 'بانک مسکن', from: '#f47920', to: '#a33e00', text: '#fff' },
  '015': { name: 'بانک سپه', from: '#0b5aa6', to: '#063560', text: '#fff' },
  '016': { name: 'بانک کشاورزی', from: '#3e8e2f', to: '#1e5c13', text: '#fff' },
  '018': { name: 'بانک تجارت', from: '#1565c0', to: '#0a3160', text: '#fff' },
  '019': { name: 'بانک صادرات ایران', from: '#00297b', to: '#001445', text: '#fff' },
  '020': { name: 'بانک توسعه صادرات', from: '#6a1b9a', to: '#380d55', text: '#fff' },
  '021': { name: 'پست بانک ایران', from: '#00897b', to: '#004d40', text: '#fff' },
  '022': { name: 'بانک توسعه تعاون', from: '#2e7d32', to: '#14401a', text: '#fff' },
  '051': { name: 'موسسه اعتباری توسعه', from: '#5d4037', to: '#33221e', text: '#fff' },
  '053': { name: 'بانک کارآفرین', from: '#00838f', to: '#003f46', text: '#fff' },
  '054': { name: 'بانک پارسیان', from: '#e87817', to: '#8f4200', text: '#fff' },
  '055': { name: 'بانک اقتصاد نوین', from: '#3949ab', to: '#1a237e', text: '#fff' },
  '056': { name: 'بانک سامان', from: '#1e88e5', to: '#0d3f73', text: '#fff' },
  '057': { name: 'بانک پاسارگاد', from: '#f7b500', to: '#8c5e00', text: '#1a1400' },
  '058': { name: 'بانک سرمایه', from: '#2e7d32', to: '#103815', text: '#fff' },
  '059': { name: 'بانک سینا', from: '#283593', to: '#101748', text: '#fff' },
  '060': { name: 'قرض‌الحسنه مهر ایران', from: '#00796b', to: '#003d33', text: '#fff' },
  '061': { name: 'بانک شهر', from: '#c62828', to: '#6e1010', text: '#fff' },
  '062': { name: 'بانک آینده', from: '#7b1fa2', to: '#3d0e52', text: '#fff' },
  '063': { name: 'بانک انصار', from: '#00695c', to: '#002e28', text: '#fff' },
  '064': { name: 'بانک گردشگری', from: '#0097a7', to: '#004048', text: '#fff' },
  '065': { name: 'بانک حکمت ایرانیان', from: '#5c6bc0', to: '#28326b', text: '#fff' },
  '066': { name: 'بانک دی', from: '#00acc1', to: '#005259', text: '#fff' },
  '069': { name: 'بانک ایران زمین', from: '#4e342e', to: '#241512', text: '#fff' },
  '070': { name: 'قرض‌الحسنه رسالت', from: '#6d4c41', to: '#362420', text: '#fff' },
  '095': { name: 'بانک ایران‌ونزوئلا', from: '#37474f', to: '#161f24', text: '#fff' },
}

/**
 * تشخیص بانک از شماره شبا — کد بانک = کاراکترهای ۴ تا ۶ IBAN
 * اگر کد ناشناخته بود، کارت خاکستری با نام «بانک» برمی‌گردد
 */
export function detectBank(iban: string): BankInfo {
  const code = iban.slice(4, 7)
  const found = BANKS[code]
  if (found) return { code, ...GENERIC, ...found }
  return { code, name: 'بانک', ...GENERIC }
}

/**
 * تشخیص بانک از شماره کارت — BIN = ۶ رقم اول PAN
 * نام و لوگوی رسمی از ir-banks-info (پوشش تمام بانک‌های ایران)
 * گرادیانت از جدول داخلی با تطبیق نام فارسی
 */
export function detectBankByCard(pan: string): BankInfo {
  if (!/^\d{6}/.test(pan)) return { code: '', name: 'بانک', ...GENERIC }
  const info = getBankInfoWithCardNumber(pan.slice(0, 6))
  if (!info?.name) return { code: '', name: 'بانک', ...GENERIC }
  const entry = Object.entries(BANKS).find(([, b]) => b.name === info.name)
  const code = entry?.[0] ?? ''
  const colors = entry?.[1] ?? GENERIC
  return { code, name: info.name, ...colors, logo: info.logo }
}

/** ماسک شبا برای نمایش — IR•• •••• •••• ۱۲۳۴ */
export function maskIban(iban: string): string {
  return `IR•• •••• •••• ${iban.slice(-4)}`
}

/** ماسک شماره کارت — ۶۲۱۹••••••••۱۲۳۴ */
export function maskCardPan(pan: string): string {
  return `${pan.slice(0, 4)}••••••••${pan.slice(-4)}`
}
