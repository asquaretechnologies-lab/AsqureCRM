import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createLeadSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact person name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  city: z.string().optional(),
  businessType: z.string().optional(),
  source: z.string().optional(),
  productId: z.string().uuid().optional().or(z.literal('')),
  expectedValue: z.number().min(0).default(0),
  status: z.enum(['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('NEW'),
  assignedToId: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional(),
});

const updateLeadSchema = z.object({
  companyName: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  city: z.string().optional(),
  businessType: z.string().optional(),
  source: z.string().optional(),
  productId: z.string().uuid().optional().or(z.literal('')),
  expectedValue: z.number().min(0).optional(),
  status: z.enum(['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
  assignedToId: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export async function getLeads(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const assignedToId = req.query.assignedToId as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { leadNumber: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          convertedCustomer: { select: { id: true, businessName: true, customerCode: true } },
          _count: { select: { activities: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    const formattedLeads = leads.map((l) => ({
      id: l.id,
      leadNumber: l.leadNumber,
      companyName: l.companyName,
      contactName: l.contactName,
      email: l.email,
      phone: l.phone,
      city: l.city,
      businessType: l.businessType,
      source: l.source,
      expectedValue: l.expectedValue ? Number(l.expectedValue) : 0,
      status: l.status,
      assignedTo: l.assignedTo,
      convertedCustomer: l.convertedCustomer,
      activityCount: l._count.activities,
      createdAt: l.createdAt,
    }));

    const totalPipelineValue = leads.reduce((sum, l) => sum + (l.expectedValue ? Number(l.expectedValue) : 0), 0);
    const wonCount = leads.filter((l) => l.status === 'WON').length;

    return res.json({
      success: true,
      data: {
        leads: formattedLeads,
        metrics: {
          totalPipelineValue,
          wonCount,
        },
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

export async function getLeadById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, phone: true } },
        convertedCustomer: { select: { id: true, businessName: true, customerCode: true } },
        activities: {
          orderBy: { activityDate: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Sales lead record not found' },
      });
    }

    return res.json({
      success: true,
      data: {
        ...lead,
        expectedValue: lead.expectedValue ? Number(lead.expectedValue) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createLead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createLeadSchema.safeParse(req.body);
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

    // Auto-generate lead number
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const leadNumber = `LEAD-${year}-${randomSeq}`;

    const assignedToId = data.assignedToId || req.user?.id || (await prisma.user.findFirst({ where: { status: 'ACTIVE' } }))?.id;

    if (!assignedToId) {
      return res.status(400).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Assigned sales user is required' } });
    }

    const lead = await prisma.lead.create({
      data: {
        leadNumber,
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email || null,
        phone: data.phone || null,
        city: data.city || null,
        businessType: data.businessType || null,
        source: data.source || 'Direct Outreach',
        productId: data.productId || null,
        expectedValue: data.expectedValue,
        status: data.status,
        assignedToId,
        notes: data.notes,
      },
      include: {
        assignedTo: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Lead',
        entityId: lead.id,
        action: 'CREATE',
        newValues: {
          leadNumber: lead.leadNumber,
          companyName: lead.companyName,
          expectedValue: lead.expectedValue,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Sales Lead ${leadNumber} created successfully`,
      data: lead,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateLead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parseResult = updateLeadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sales lead not found' } });
    }

    const updateData: any = { ...parseResult.data };
    if (updateData.assignedToId === '') delete updateData.assignedToId;
    if (updateData.productId === '') delete updateData.productId;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Lead',
        entityId: id,
        action: 'UPDATE',
        oldValues: { status: existingLead.status, expectedValue: existingLead.expectedValue },
        newValues: { status: updatedLead.status, expectedValue: updatedLead.expectedValue },
      },
    });

    return res.json({
      success: true,
      message: `Sales Lead ${updatedLead.leadNumber} updated successfully`,
      data: updatedLead,
    });
  } catch (err) {
    next(err);
  }
}

export async function convertLeadToCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sales lead not found' } });
    }

    if (lead.convertedCustomerId) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_CONVERTED', message: 'Lead has already been converted to a customer' },
      });
    }

    // Auto-generate Customer Code
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const customerCode = `CUST-${year}-${randomSeq}`;

    // Execute atomic transaction to create customer & update lead status to WON
    const [customer, updatedLead] = await prisma.$transaction([
      prisma.customer.create({
        data: {
          customerCode,
          businessName: lead.companyName,
          displayName: lead.companyName,
          phone: lead.phone,
          email: lead.email,
          city: lead.city,
          businessType: lead.businessType,
          status: 'ACTIVE',
          salesUserId: lead.assignedToId,
        },
      }),
      prisma.lead.update({
        where: { id },
        data: {
          status: 'WON',
        },
      }),
    ]);

    // Link converted customer ID
    await prisma.lead.update({
      where: { id },
      data: { convertedCustomerId: customer.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Lead',
        entityId: id,
        action: 'CONVERT_TO_CUSTOMER',
        newValues: {
          customerCode: customer.customerCode,
          businessName: customer.businessName,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Lead ${lead.leadNumber} successfully converted to Customer ${customer.customerCode}`,
      data: {
        customer,
        lead: updatedLead,
      },
    });
  } catch (err) {
    next(err);
  }
}
