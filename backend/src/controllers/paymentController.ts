import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { z } from 'zod';

const createPaymentSchema = z.object({
  invoiceId: z.string().uuid('Valid invoice ID is required'),
  customerId: z.string().uuid('Valid customer ID is required'),
  amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'UPI', 'CHEQUE', 'CASH', 'CREDIT_CARD']).default('UPI'),
  paymentDate: z.string().optional(),
  referenceNumber: z.string().optional(),
  bankName: z.string().optional(),
  notes: z.string().optional(),
});

export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const customerId = req.query.customerId as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (customerId) where.customerId = customerId;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: { select: { id: true, businessName: true, customerCode: true } },
          invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, balanceAmount: true } },
          collectedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const formattedPayments = payments.map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      paymentDate: p.paymentDate,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      referenceNumber: p.referenceNumber,
      bankName: p.bankName,
      customer: p.customer,
      invoice: p.invoice ? { ...p.invoice, totalAmount: Number(p.invoice.totalAmount), balanceAmount: Number(p.invoice.balanceAmount) } : null,
      collectedBy: p.collectedBy?.name,
      createdAt: p.createdAt,
    }));

    return res.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const data = parseResult.data;

    // Validate Invoice
    const invoice = await prisma.invoice.findUnique({ where: { id: data.invoiceId } });
    if (!invoice) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    }

    // Auto-generate receipt number
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `REC-${year}-${randomSeq}`;

    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();

    const collectedById = req.user?.id || (await prisma.user.findFirst({ where: { status: 'ACTIVE' } }))?.id;

    if (!collectedById) {
      return res.status(400).json({ success: false, error: { code: 'AUTH_ERROR', message: 'User authentication required' } });
    }

    // Calculate new amounts
    const currentPaid = Number(invoice.amountPaid);
    const newAmountPaid = currentPaid + data.amount;
    const newBalanceAmount = Math.max(0, Number(invoice.totalAmount) - newAmountPaid);
    const newStatus = newBalanceAmount <= 0 ? 'PAID' : 'PARTIAL';

    // Execute atomic transaction
    const [paymentRecord, updatedInvoice] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          receiptNumber,
          invoiceId: data.invoiceId,
          customerId: data.customerId,
          paymentDate,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          bankName: data.bankName,
          collectedById,
          notes: data.notes,
        },
        include: {
          customer: { select: { businessName: true } },
          invoice: { select: { invoiceNumber: true } },
        },
      }),
      prisma.invoice.update({
        where: { id: data.invoiceId },
        data: {
          amountPaid: newAmountPaid,
          balanceAmount: newBalanceAmount,
          status: newStatus,
        },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Payment',
        entityId: paymentRecord.id,
        action: 'CREATE_PAYMENT',
        newValues: {
          receiptNumber: paymentRecord.receiptNumber,
          invoiceNumber: invoice.invoiceNumber,
          amount: data.amount,
          newStatus,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Payment receipt ${receiptNumber} recorded successfully. Invoice balance: ₹${newBalanceAmount}`,
      data: {
        payment: paymentRecord,
        invoice: updatedInvoice,
      },
    });
  } catch (err) {
    next(err);
  }
}
