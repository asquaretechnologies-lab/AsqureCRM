import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createOutletSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  outletCode: z.string().min(1, 'Outlet code is required'),
  outletName: z.string().min(1, 'Outlet name is required'),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  notes: z.string().optional(),
});

const updateOutletSchema = createOutletSchema.partial();

export async function getOutlets(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId, search } = req.query;

    const where: any = {};
    if (customerId) {
      where.customerId = customerId as string;
    }
    if (search) {
      where.OR = [
        { outletCode: { contains: search as string, mode: 'insensitive' } },
        { outletName: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const outlets = await prisma.outlet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, businessName: true, customerCode: true } },
        _count: {
          select: { installations: true },
        },
      },
    });

    return res.json({
      success: true,
      data: outlets,
    });
  } catch (err) {
    next(err);
  }
}

export async function createOutlet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createOutletSchema.safeParse(req.body);
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

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found' },
      });
    }

    // Check unique outletCode for this customer
    const existingOutlet = await prisma.outlet.findUnique({
      where: {
        customerId_outletCode: {
          customerId: data.customerId,
          outletCode: data.outletCode,
        },
      },
    });

    if (existingOutlet) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_RECORD', message: 'Outlet code already exists for this customer' },
      });
    }

    const outlet = await prisma.outlet.create({
      data: {
        customerId: data.customerId,
        outletCode: data.outletCode,
        outletName: data.outletName,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        country: data.country || 'India',
        postalCode: data.postalCode,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email || null,
        status: data.status,
        notes: data.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Outlet',
        entityId: outlet.id,
        action: 'CREATE',
        newValues: { outletCode: outlet.outletCode, outletName: outlet.outletName },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Outlet branch created successfully',
      data: outlet,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateOutlet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parseResult = updateOutletSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const existingOutlet = await prisma.outlet.findUnique({ where: { id } });
    if (!existingOutlet) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Outlet not found' },
      });
    }

    const data = parseResult.data;

    const updatedOutlet = await prisma.outlet.update({
      where: { id },
      data: {
        ...data,
        email: data.email === '' ? null : data.email,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Outlet',
        entityId: id,
        action: 'UPDATE',
        newValues: { outletName: updatedOutlet.outletName, status: updatedOutlet.status },
      },
    });

    return res.json({
      success: true,
      message: 'Outlet updated successfully',
      data: updatedOutlet,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteOutlet(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const existingOutlet = await prisma.outlet.findUnique({
      where: { id },
      include: { _count: { select: { installations: true } } },
    });

    if (!existingOutlet) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Outlet not found' },
      });
    }

    if (existingOutlet._count.installations > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'HAS_DEPENDENCIES',
          message: 'Cannot delete outlet with active installations. Deactivate outlet instead.',
        },
      });
    }

    await prisma.outlet.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Outlet',
        entityId: id,
        action: 'DELETE',
        oldValues: { outletName: existingOutlet.outletName },
      },
    });

    return res.json({
      success: true,
      message: 'Outlet deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
