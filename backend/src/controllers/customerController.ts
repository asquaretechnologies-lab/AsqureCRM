import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createCustomerSchema = z.object({
  customerCode: z.string().min(1, 'Customer code is required'),
  businessName: z.string().min(1, 'Business name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  customerType: z.string().optional(),
  businessType: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  website: z.string().optional(),
  taxNumber: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  salesUserId: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['PROSPECT', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED']).default('ACTIVE'),
  source: z.string().optional(),
  notes: z.string().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const salesUserId = req.query.salesUserId as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { customerCode: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { taxNumber: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (salesUserId) {
      where.salesUserId = salesUserId;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          salesUser: {
            select: { id: true, name: true, email: true },
          },
          contacts: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              outlets: true,
              installations: true,
              licenses: { where: { status: 'ACTIVE' } },
              invoices: true,
              tickets: { where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } } },
            },
          },
          invoices: {
            select: { balanceAmount: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const formattedCustomers = customers.map((c) => {
      const primaryContact = c.contacts[0] || null;
      const totalOutstanding = c.invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);

      return {
        id: c.id,
        customerCode: c.customerCode,
        businessName: c.businessName,
        displayName: c.displayName,
        customerType: c.customerType,
        businessType: c.businessType,
        phone: c.phone,
        email: c.email,
        city: c.city,
        state: c.state,
        status: c.status,
        salesUser: c.salesUser,
        primaryContact: primaryContact
          ? { id: primaryContact.id, name: primaryContact.name, phone: primaryContact.phone, email: primaryContact.email }
          : null,
        outletCount: c._count.outlets,
        installationCount: c._count.installations,
        activeLicenseCount: c._count.licenses,
        openTicketCount: c._count.tickets,
        totalOutstanding,
        createdAt: c.createdAt,
      };
    });

    return res.json({
      success: true,
      data: {
        customers: formattedCustomers,
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

export async function getCustomer360(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        salesUser: { select: { id: true, name: true, email: true } },
        contacts: { orderBy: { isPrimary: 'desc' } },
        outlets: { orderBy: { createdAt: 'desc' } },
        installations: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: true,
            outlet: { select: { id: true, outletName: true, outletCode: true } },
          },
        },
        licenses: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: true,
            plan: true,
            installation: { select: { id: true, installationNumber: true } },
          },
        },
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          include: {
            items: true,
            payments: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            invoice: { select: { id: true, invoiceNumber: true } },
          },
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: { select: { id: true, name: true } },
            outlet: { select: { id: true, outletName: true } },
          },
        },
        activities: {
          orderBy: { activityDate: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found' },
      });
    }

    // Fetch audit history for this customer entity
    const auditLogs = await prisma.auditLog.findMany({
      where: { entityType: 'Customer', entityId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Summary calculation
    const activeLicenses = customer.licenses.filter((l) => l.status === 'ACTIVE');
    const openTickets = customer.tickets.filter((t) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status));
    const totalOutstanding = customer.invoices.reduce((sum, inv) => sum + Number(inv.balanceAmount), 0);
    const totalBilled = customer.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPaid = customer.payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return res.json({
      success: true,
      data: {
        customer,
        summary: {
          outletCount: customer.outlets.length,
          installationCount: customer.installations.length,
          activeLicenseCount: activeLicenses.length,
          totalLicenseCount: customer.licenses.length,
          openTicketCount: openTickets.length,
          totalOutstanding,
          totalBilled,
          totalPaid,
        },
        auditLogs,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createCustomerSchema.safeParse(req.body);
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

    // Check unique customerCode
    const existingCode = await prisma.customer.findUnique({
      where: { customerCode: data.customerCode },
    });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_RECORD', message: 'Customer code already exists' },
      });
    }

    const customer = await prisma.customer.create({
      data: {
        customerCode: data.customerCode,
        businessName: data.businessName,
        displayName: data.displayName,
        customerType: data.customerType,
        businessType: data.businessType,
        phone: data.phone,
        email: data.email || null,
        whatsapp: data.whatsapp,
        website: data.website,
        taxNumber: data.taxNumber,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        country: data.country || 'India',
        postalCode: data.postalCode,
        salesUserId: data.salesUserId || null,
        status: data.status,
        source: data.source,
        notes: data.notes,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Customer',
        entityId: customer.id,
        action: 'CREATE',
        newValues: {
          customerCode: customer.customerCode,
          businessName: customer.businessName,
          status: customer.status,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parseResult = updateCustomerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found' },
      });
    }

    const data = parseResult.data;

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        email: data.email === '' ? null : data.email,
        salesUserId: data.salesUserId === '' ? null : data.salesUserId,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Customer',
        entityId: id,
        action: 'UPDATE',
        oldValues: {
          businessName: existingCustomer.businessName,
          phone: existingCustomer.phone,
          status: existingCustomer.status,
        },
        newValues: {
          businessName: updatedCustomer.businessName,
          phone: updatedCustomer.phone,
          status: updatedCustomer.status,
        },
      },
    });

    return res.json({
      success: true,
      message: 'Customer profile updated successfully',
      data: updatedCustomer,
    });
  } catch (err) {
    next(err);
  }
}
