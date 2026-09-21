// ============================================
// Zar30 - Financial Errors (Deterministic)
// ============================================
// خطاهای مالی deterministic — کد پایدار در type، پیام فارسی در detail
// ============================================

import { ApiError } from '@/lib/errors/api-error'

const BASE = 'https://zar30.com/errors'

export const FinanceErrors = {
  insufficientBalance: () =>
    new ApiError(422, 'Insufficient Balance', 'موجودی کافی نیست', `${BASE}/insufficient-balance`),

  insufficientLocked: () =>
    new ApiError(
      422,
      'Insufficient Locked Balance',
      'موجودی مسدودشده کافی نیست',
      `${BASE}/insufficient-locked`,
    ),

  invalidAmount: (detail = 'مبلغ نامعتبر است') =>
    new ApiError(422, 'Invalid Amount', detail, `${BASE}/invalid-amount`),

  priceUnavailable: () =>
    new ApiError(
      503,
      'Price Unavailable',
      'قیمت لحظه‌ای طلا در دسترس نیست؛ لطفاً کمی بعد تلاش کنید',
      `${BASE}/price-unavailable`,
    ),

  orderNotFound: () =>
    new ApiError(404, 'Order Not Found', 'سفارش یافت نشد', `${BASE}/order-not-found`),

  withdrawalNotFound: () =>
    new ApiError(
      404,
      'Withdrawal Not Found',
      'درخواست برداشت یافت نشد',
      `${BASE}/withdrawal-not-found`,
    ),

  depositNotFound: () =>
    new ApiError(404, 'Deposit Not Found', 'واریز یافت نشد', `${BASE}/deposit-not-found`),

  invalidState: (detail = 'وضعیت فعلی این عملیات را مجاز نمی کند') =>
    new ApiError(409, 'Invalid State', detail, `${BASE}/invalid-state`),

  withdrawalAlreadyProcessed: () =>
    new ApiError(
      409,
      'Withdrawal Already Processed',
      'این درخواست برداشت قبلاً پردازش شده است',
      `${BASE}/withdrawal-processed`,
    ),

  idempotencyKeyRequired: () =>
    new ApiError(
      400,
      'Idempotency Key Required',
      'هدر Idempotency-Key الزامی است',
      `${BASE}/idempotency-required`,
    ),

  idempotencyConflict: () =>
    new ApiError(
      409,
      'Idempotency Conflict',
      'این کلید قبلاً با بدنه متفاوت استفاده شده است',
      `${BASE}/idempotency-conflict`,
    ),

  concurrentOperation: () =>
    new ApiError(
      409,
      'Concurrent Operation',
      'عملیات مشابه در حال انجام است؛ لطفاً کمی بعد تلاش کنید',
      `${BASE}/concurrent-operation`,
    ),

  ledgerImbalance: () =>
    new ApiError(
      500,
      'Ledger Imbalance',
      'خطای داخلی در توازن دفتر کل',
      `${BASE}/ledger-imbalance`,
    ),

  ledgerAccountMissing: (code: string) =>
    new ApiError(
      500,
      'Ledger Account Missing',
      `حساب دفتر کل ${code} یافت نشد`,
      `${BASE}/ledger-account-missing`,
    ),

  journalNotFound: () =>
    new ApiError(404, 'Journal Not Found', 'سند حسابداری یافت نشد', `${BASE}/journal-not-found`),

  journalNotReversible: () =>
    new ApiError(
      409,
      'Journal Not Reversible',
      'این سند قابل برگشت نیست',
      `${BASE}/journal-not-reversible`,
    ),

  kycRequired: (detail = 'برای این عملیات احراز هویت لازم است') =>
    new ApiError(403, 'KYC Required', detail, `${BASE}/kyc-required`),

  limitExceeded: (detail = 'سقف مجاز این عملیات رعایت نشده است') =>
    new ApiError(422, 'Limit Exceeded', detail, `${BASE}/limit-exceeded`),

  walletNotFound: () =>
    new ApiError(404, 'Wallet Not Found', 'کیف پول یافت نشد', `${BASE}/wallet-not-found`),

  abnormalPrice: () =>
    new ApiError(
      422,
      'Abnormal Price',
      'جهش قیمت غیرعادی شناسایی شد؛ قیمت برای بررسی ثبت نشد',
      `${BASE}/abnormal-price`,
    ),

  paymentNotFound: () =>
    new ApiError(404, 'Payment Not Found', 'پرداخت یافت نشد', `${BASE}/payment-not-found`),

  amountMismatch: () =>
    new ApiError(
      409,
      'Amount Mismatch',
      'مبلغ برگشتی درگاه با مبلغ پرداخت مطابقت ندارد',
      `${BASE}/amount-mismatch`,
    ),

  gatewayError: (detail = 'خطا در ارتباط با درگاه پرداخت') =>
    new ApiError(502, 'Gateway Error', detail, `${BASE}/gateway-error`),

  providerUnavailable: (detail = 'سرویس قیمت در دسترس نیست') =>
    new ApiError(503, 'Price Provider Unavailable', detail, `${BASE}/provider-unavailable`),
} as const
