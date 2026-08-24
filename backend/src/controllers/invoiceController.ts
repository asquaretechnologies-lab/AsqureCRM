import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const invoiceItemSchema = z.object({
  productId: z.string().uuid().optional().or(z.literal('')),
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().min(0.01).default(1),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
});

const createInvoiceSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  outletId: z.string().uuid().optional().or(z.literal('')),
  installationId: z.string().uuid().optional().or(z.literal('')),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  invoiceType: z.string().default('STANDARD'),
  discount: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice line item is required'),
});

export async function getInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const customerId = req.query.customerId as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
        { customer: { customerCode: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { invoiceDate: 'desc' },
        include: {
          customer: { select: { id: true, businessName: true, customerCode: true } },
          outlet: { select: { id: true, outletName: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { items: true, payments: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceType: inv.invoiceType,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      subtotal: Number(inv.subtotal),
      discount: Number(inv.discount),
      tax: Number(inv.tax),
      totalAmount: Number(inv.totalAmount),
      amountPaid: Number(inv.amountPaid),
      balanceAmount: Number(inv.balanceAmount),
      status: inv.status,
      customer: inv.customer,
      outlet: inv.outlet,
      createdBy: inv.createdBy?.name,
      itemCount: inv._count.items,
      paymentCount: inv._count.payments,
      createdAt: inv.createdAt,
    }));

    return res.json({
      success: true,
      data: {
        invoices: formattedInvoices,
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

export async function getInvoiceById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, businessName: true, customerCode: true, taxNumber: true, phone: true, email: true, addressLine1: true, city: true, state: true } },
        outlet: { select: { id: true, outletName: true, outletCode: true, city: true } },
        installation: { select: { id: true, installationNumber: true, version: true } },
        createdBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, productCode: true } },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            collectedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invoice record not found' },
      });
    }

    return res.json({
      success: true,
      data: {
        ...invoice,
        subtotal: Number(invoice.subtotal),
        discount: Number(invoice.discount),
        tax: Number(invoice.tax),
        totalAmount: Number(invoice.totalAmount),
        amountPaid: Number(invoice.amountPaid),
        balanceAmount: Number(invoice.balanceAmount),
        items: invoice.items.map((it) => ({
          ...it,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          discount: Number(it.discount),
          tax: Number(it.tax),
          total: Number(it.total),
        })),
        payments: invoice.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createInvoice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createInvoiceSchema.safeParse(req.body);
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

    // Validate Customer
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    }

    // Auto-generate invoice number
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${year}-${randomSeq}`;

    // Dates
    const invoiceDate = data.invoiceDate ? new Date(data.invoiceDate) : new Date();
    const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days credit term

    // Calculate line items and totals
    let subtotal = 0;
    let totalTax = 0;

    const processedItems = data.items.map((item) => {
      const lineSubtotal = item.quantity * item.unitPrice - item.discount;
      const lineTax = lineSubtotal * (item.tax / 100);
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      totalTax += lineTax;

      return {
        productId: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: lineTax,
        total: lineTotal,
      };
    });

    const overallDiscount = data.discount;
    const totalAmount = subtotal - overallDiscount + totalTax;
    const amountPaid = 0;
    const balanceAmount = totalAmount;

    const createdById = req.user?.id || (await prisma.user.findFirst({ where: { status: 'ACTIVE' } }))?.id;

    if (!createdById) {
      return res.status(400).json({ success: false, error: { code: 'AUTH_ERROR', message: 'User authentication required' } });
    }

    // Transaction to create invoice and line items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: data.customerId,
        outletId: data.outletId || null,
        installationId: data.installationId || null,
        invoiceDate,
        dueDate,
        invoiceType: data.invoiceType,
        subtotal,
        discount: overallDiscount,
        tax: totalTax,
        totalAmount,
        amountPaid,
        balanceAmount,
        status: 'UNPAID',
        createdById,
        notes: data.notes,
        items: {
          create: processedItems,
        },
      },
      include: {
        customer: { select: { businessName: true } },
        items: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Invoice',
        entityId: invoice.id,
        action: 'CREATE',
        newValues: {
          invoiceNumber: invoice.invoiceNumber,
          customer: invoice.customer.businessName,
          totalAmount,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
}

export async function getOutstanding(req: Request, res: Response, next: NextFunction) {
  try {
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
        balanceAmount: { gt: 0 },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        customer: { select: { id: true, businessName: true, customerCode: true, phone: true, email: true } },
        outlet: { select: { id: true, outletName: true } },
      },
    });

    const now = new Date();

    const formattedUnpaid = unpaidInvoices.map((inv) => {
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.businessName,
        customerCode: inv.customer.customerCode,
        customerPhone: inv.customer.phone,
        customerEmail: inv.customer.email,
        outletName: inv.outlet?.outletName || 'Main',
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        totalAmount: Number(inv.totalAmount),
        amountPaid: Number(inv.amountPaid),
        balanceAmount: Number(inv.balanceAmount),
        daysOverdue,
        status: daysOverdue > 0 ? 'OVERDUE' : inv.status,
      };
    });

    const totalOutstanding = formattedUnpaid.reduce((sum, item) => sum + item.balanceAmount, 0);

    return res.json({
      success: true,
      data: {
        totalOutstanding,
        unpaidCount: formattedUnpaid.length,
        invoices: formattedUnpaid,
      },
    });
  } catch (err) {
    next(err);
  }
}
