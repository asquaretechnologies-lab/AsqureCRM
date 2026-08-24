import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createTicketSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  outletId: z.string().uuid().optional().or(z.literal('')),
  installationId: z.string().uuid().optional().or(z.literal('')),
  contactId: z.string().uuid().optional().or(z.literal('')),
  subject: z.string().min(1, 'Ticket subject is required'),
  description: z.string().min(1, 'Issue description is required'),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'LICENSE', 'BILLING', 'GENERAL']).default('SOFTWARE'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignedToId: z.string().uuid().optional().or(z.literal('')),
});

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'LICENSE', 'BILLING', 'GENERAL']).optional(),
  assignedToId: z.string().uuid().optional().or(z.literal('')),
  resolutionNotes: z.string().optional(),
});

const addCommentSchema = z.object({
  comment: z.string().min(1, 'Comment text is required'),
});

export async function getTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const category = req.query.category as string;
    const customerId = req.query.customerId as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (customerId) where.customerId = customerId;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, businessName: true, customerCode: true } },
          outlet: { select: { id: true, outletName: true } },
          assignedTo: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    const formattedTickets = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      customer: t.customer,
      outlet: t.outlet,
      assignedTo: t.assignedTo,
      commentCount: t._count.comments,
      createdAt: t.createdAt,
    }));

    const openCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const urgentCount = tickets.filter((t) => t.priority === 'URGENT' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
    const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    return res.json({
      success: true,
      data: {
        tickets: formattedTickets,
        metrics: {
          openCount,
          urgentCount,
          resolvedCount,
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

export async function getTicketById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, businessName: true, customerCode: true, phone: true, email: true } },
        outlet: { select: { id: true, outletName: true, outletCode: true } },
        installation: { select: { id: true, installationNumber: true, version: true } },
        contact: { select: { id: true, name: true, phone: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Support ticket record not found' },
      });
    }

    return res.json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    next(err);
  }
}

export async function createTicket(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createTicketSchema.safeParse(req.body);
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

    // Auto-generate ticket number
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TCK-${year}-${randomSeq}`;

    const assignedToId = data.assignedToId || (await prisma.user.findFirst({ where: { status: 'ACTIVE' } }))?.id;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        customerId: data.customerId,
        outletId: data.outletId || null,
        installationId: data.installationId || null,
        contactId: data.contactId || null,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: 'OPEN',
        assignedToId: assignedToId || null,
      },
      include: {
        customer: { select: { businessName: true } },
        assignedTo: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Ticket',
        entityId: ticket.id,
        action: 'CREATE',
        newValues: {
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          priority: ticket.priority,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Support Ticket ${ticketNumber} created successfully`,
      data: ticket,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTicket(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parseResult = updateTicketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const existingTicket = await prisma.ticket.findUnique({ where: { id } });
    if (!existingTicket) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Support ticket not found' } });
    }

    const updateData: any = { ...parseResult.data };
    if (updateData.assignedToId === '') delete updateData.assignedToId;

    const now = new Date();
    if (updateData.status === 'RESOLVED' && !existingTicket.resolvedAt) {
      updateData.resolvedAt = now;
    }
    if (updateData.status === 'CLOSED' && !existingTicket.closedAt) {
      updateData.closedAt = now;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Ticket',
        entityId: id,
        action: 'UPDATE',
        oldValues: { status: existingTicket.status, priority: existingTicket.priority },
        newValues: { status: updatedTicket.status, priority: updatedTicket.priority },
      },
    });

    return res.json({
      success: true,
      message: `Ticket ${updatedTicket.ticketNumber} updated to ${updatedTicket.status}`,
      data: updatedTicket,
    });
  } catch (err) {
    next(err);
  }
}

export async function addTicketComment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parseResult = addCommentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const userId = req.user?.id || (await prisma.user.findFirst({ where: { status: 'ACTIVE' } }))?.id;

    if (!userId) {
      return res.status(400).json({ success: false, error: { code: 'AUTH_ERROR', message: 'User authentication required' } });
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: id,
        userId,
        comment: parseResult.data.comment,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Comment added to ticket thread',
      data: comment,
    });
  } catch (err) {
    next(err);
  }
}
