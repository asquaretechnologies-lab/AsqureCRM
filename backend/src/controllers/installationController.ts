import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';
import { z } from 'zod';

const createInstallationSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  outletId: z.string().uuid('Valid outlet ID is required'),
  productId: z.string().uuid('Valid product ID is required'),
  installationNumber: z.string().optional(),
  version: z.string().default('1.0.0'),
  serverType: z.string().optional(),
  serverName: z.string().optional(),
  terminalCount: z.number().int().min(1).default(1),
  userCount: z.number().int().min(1).default(1),
  status: z.enum(['PLANNED', 'INSTALLED', 'ACTIVATED', 'SUSPENDED', 'DECOMMISSIONED']).default('ACTIVATED'),
  notes: z.string().optional(),
});

const updateInstallationSchema = createInstallationSchema.partial();

export async function getInstallations(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const productId = req.query.productId as string;
    const status = req.query.status as string;
    const customerId = req.query.customerId as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { installationNumber: { contains: search, mode: 'insensitive' } },
        { version: { contains: search, mode: 'insensitive' } },
        { serverName: { contains: search, mode: 'insensitive' } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
        { outlet: { outletName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [installations, total] = await Promise.all([
      prisma.installation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, businessName: true, customerCode: true } },
          outlet: { select: { id: true, outletName: true, outletCode: true, city: true } },
          product: { select: { id: true, name: true, productCode: true } },
          installedBy: { select: { id: true, name: true } },
          _count: {
            select: { licenses: true },
          },
        },
      }),
      prisma.installation.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        installations,
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

export async function createInstallation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createInstallationSchema.safeParse(req.body);
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

    // Verify Customer
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer not found' },
      });
    }

    // Verify Outlet
    const outlet = await prisma.outlet.findUnique({ where: { id: data.outletId } });
    if (!outlet) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Customer outlet not found' },
      });
    }

    // Verify Product
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'POS Product not found' },
      });
    }

    // Generate installationNumber if not supplied
    let numberToUse = data.installationNumber;
    if (!numberToUse) {
      const year = new Date().getFullYear();
      const randomSeq = Math.floor(100 + Math.random() * 900);
      numberToUse = `INS-${year}-${randomSeq}`;
    }

    const installation = await prisma.installation.create({
      data: {
        installationNumber: numberToUse,
        customerId: data.customerId,
        outletId: data.outletId,
        productId: data.productId,
        version: data.version || product.version || '1.0.0',
        serverType: data.serverType,
        serverName: data.serverName,
        terminalCount: data.terminalCount,
        userCount: data.userCount,
        installationDate: new Date(),
        installedById: req.user?.id,
        status: data.status,
        notes: data.notes,
      },
      include: {
        customer: { select: { businessName: true } },
        product: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Installation',
        entityId: installation.id,
        action: 'CREATE',
        newValues: {
          installationNumber: installation.installationNumber,
          customer: installation.customer.businessName,
          product: installation.product.name,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'POS Installation deployed successfully',
      data: installation,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateInstallation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parseResult = updateInstallationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const existingInstallation = await prisma.installation.findUnique({ where: { id } });
    if (!existingInstallation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Installation record not found' },
      });
    }

    const data = parseResult.data;

    const updatedInstallation = await prisma.installation.update({
      where: { id },
      data: {
        ...data,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Installation',
        entityId: id,
        action: 'UPDATE',
        oldValues: { status: existingInstallation.status, version: existingInstallation.version },
        newValues: { status: updatedInstallation.status, version: updatedInstallation.version },
      },
    });

    return res.json({
      success: true,
      message: 'Installation updated successfully',
      data: updatedInstallation,
    });
  } catch (err) {
    next(err);
  }
}
