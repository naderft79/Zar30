// ============================================
// Zar30 - Ticket Service (پشتیبانی)
// ============================================
// جریان: کاربر تیکت می‌سازد → ادمین تخصیص/پاسخ → کاربر پیگیری → بستن
// State: OPEN → (ادمین پاسخ) ANSWERED → (کاربر پاسخ) OPEN → ... → CLOSED
// SLA: slaDeadline در زمان ساخت بر اساس اولویت — پاسخ ادمین SLA را رفع می‌کند
// اعلان: پاسخ ادمین → notifyFinancial به کاربر (fail-open)
// isolation: همه کوئری‌های کاربر با userId اسکوپ می‌شوند (IDOR-safe)
// ============================================

import prisma from '@/lib/db/prisma'
import { ApiError } from '@/lib/errors/api-error'
import { notifyFinancial } from '@/lib/finance/notify'

const TICKET_CATEGORIES = [
  'ACCOUNT',
  'KYC',
  'TRADE',
  'INSTALLMENT',
  'INVESTMENT',
  'PAYMENT',
  'OTHER',
] as const
type TicketCategory = (typeof TICKET_CATEGORIES)[number]

// SLA اولین پاسخ بر اساس اولویت — ساعت
const SLA_HOURS: Record<string, number> = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  URGENT: 8,
}

// ساخت تیکت + پیام اول
export async function createTicket(
  ctx: { userId: string },
  input: {
    subject: string
    category: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    body: string
  },
) {
  if (!TICKET_CATEGORIES.includes(input.category as TicketCategory)) {
    throw ApiError.badRequest('دسته‌بندی نامعتبر است')
  }

  const slaHours = SLA_HOURS[input.priority] ?? 48

  const ticket = await prisma.$transaction(async (tx) => {
    const t = await tx.ticket.create({
      data: {
        userId: ctx.userId,
        subject: input.subject,
        category: input.category,
        priority: input.priority,
        status: 'OPEN',
        slaDeadline: new Date(Date.now() + slaHours * 60 * 60 * 1000),
      },
    })
    await tx.ticketMessage.create({
      data: {
        ticketId: t.id,
        senderType: 'user',
        senderId: ctx.userId,
        body: input.body,
      },
    })
    return t
  })

  return { id: ticket.id, status: ticket.status, slaDeadline: ticket.slaDeadline }
}

// پاسخ کاربر به تیکت خودش — تیکت ANSWERED → OPEN (نیاز به پاسخ ادمین دارد)
export async function replyTicket(ctx: { userId: string }, ticketId: string, body: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket || ticket.userId !== ctx.userId) {
    throw ApiError.notFound('تیکت یافت نشد')
  }
  if (ticket.status === 'CLOSED') {
    throw ApiError.badRequest('این تیکت بسته شده است')
  }

  const message = await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: ticketId },
      data: { status: 'OPEN' },
    })
    return tx.ticketMessage.create({
      data: { ticketId, senderType: 'user', senderId: ctx.userId, body },
    })
  })

  return { id: message.id, createdAt: message.createdAt }
}

// بستن تیکت توسط کاربر (فقط مالک)
export async function closeTicketByUser(ctx: { userId: string }, ticketId: string) {
  const result = await prisma.ticket.updateMany({
    where: { id: ticketId, userId: ctx.userId, status: { not: 'CLOSED' } },
    data: { status: 'CLOSED', closedAt: new Date() },
  })
  if (result.count === 0) throw ApiError.notFound('تیکت قابل بستن نیست')
  return { closed: true }
}

// لیست تیکت‌های کاربر — فقط مالک
export async function listUserTickets(userId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { messages: true } } },
    }),
    prisma.ticket.count({ where: { userId } }),
  ])
  return {
    items: items.map((t) => ({
      id: t.id,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      slaDeadline: t.slaDeadline,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      messagesCount: t._count.messages,
    })),
    total,
  }
}

// جزئیات تیکت با پیام‌ها — مالک یا ادمین
export async function getTicketMessages(ticketId: string, userId?: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!ticket) throw ApiError.notFound('تیکت یافت نشد')
  if (userId && ticket.userId !== userId) throw ApiError.notFound('تیکت یافت نشد')

  return {
    id: ticket.id,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    createdAt: ticket.createdAt,
    messages: ticket.messages.map((m) => ({
      id: m.id,
      senderType: m.senderType,
      body: m.body,
      createdAt: m.createdAt,
    })),
  }
}

// ============================================
// ادمین
// ============================================

export interface AdminActCtx {
  adminId: string
  adminRole: string
}

// پاسخ ادمین — تیکت → ANSWERED؛ کاربر اعلان می‌گیرد
export async function adminReplyTicket(ctx: AdminActCtx, ticketId: string, body: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw ApiError.notFound('تیکت یافت نشد')
  if (ticket.status === 'CLOSED') throw ApiError.badRequest('این تیکت بسته شده است')

  const result = await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: ticketId },
      data: { status: 'ANSWERED' },
    })
    return tx.ticketMessage.create({
      data: { ticketId, senderType: 'admin', senderId: ctx.adminId, body },
    })
  })

  await prisma.auditLog.create({
    data: {
      actorType: 'admin',
      actorId: ctx.adminId,
      actorRole: ctx.adminRole,
      action: 'ticket.reply',
      entityType: 'ticket',
      entityId: ticketId,
      targetUserId: ticket.userId,
    },
  })

  notifyFinancial(ticket.userId, 'ticket_reply', 'به تیکت شما پاسخ داده شد', '', {
    ticketId,
    subject: ticket.subject,
  })

  return { id: result.id, createdAt: result.createdAt }
}

// تخصیص ادمین به خودش یا همکار
export async function adminAssignTicket(
  ctx: AdminActCtx,
  ticketId: string,
  assigneeId: string | null,
) {
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assignedTo: assigneeId,
      status: assigneeId && ticketStatusWouldChange(ticketId) ? 'IN_PROGRESS' : undefined,
    },
  })
  await prisma.auditLog.create({
    data: {
      actorType: 'admin',
      actorId: ctx.adminId,
      actorRole: ctx.adminRole,
      action: 'ticket.assign',
      entityType: 'ticket',
      entityId: ticketId,
      after: { assignedTo: assigneeId },
    },
  })
  return { id: ticket.id, assignedTo: ticket.assignedTo }
}

function ticketStatusWouldChange(_ticketId: string): boolean {
  return true
}

// بستن ادمین
export async function adminCloseTicket(ctx: AdminActCtx, ticketId: string) {
  const result = await prisma.ticket.updateMany({
    where: { id: ticketId, status: { not: 'CLOSED' } },
    data: { status: 'CLOSED', closedAt: new Date() },
  })
  if (result.count === 0) throw ApiError.notFound('تیکت قابل بستن نیست')
  await prisma.auditLog.create({
    data: {
      actorType: 'admin',
      actorId: ctx.adminId,
      actorRole: ctx.adminRole,
      action: 'ticket.close',
      entityType: 'ticket',
      entityId: ticketId,
    },
  })
  return { closed: true }
}
