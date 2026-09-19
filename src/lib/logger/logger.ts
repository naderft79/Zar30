// ============================================
// Zar30 - Structured Logger (pino)
// ============================================
// لاگ ها به زبان انگلیسی می باشند (طبق قانون پروژه)
// Never log: passwords, OTPs, tokens, secrets, card numbers
// ============================================

import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  // در development خروجی زیبا، در production ساختاریافته JSON
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
  redact: {
    // جلوگیری از نشت اطلاعات حساس در لاگ
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'otp',
      'code',
      'refreshToken',
      'accessToken',
      '*.password',
      '*.passwordHash',
      '*.otp',
      '*.code',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
  base: {
    app: 'zar30',
    env: process.env.NODE_ENV,
  },
})

export default logger
