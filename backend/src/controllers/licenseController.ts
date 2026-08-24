import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { generateLicenseKey, calculateExpiryDate } from '../utils/licenseGenerator';
import { z } from 'zod';

const issueLicenseSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  installationId: z.string().uuid('Valid installation ID is required'),
  productId: z.string().uuid('Valid product ID is required'),
  planId: z.string().uuid().optional().or(z.literal('')),
  licenseType: z.string().default('SUBSCRIPTION'),
  startDate: z.string().optional(),
  expiryDate: z.string().optional(),
  terminalCount: z.number().int().min(1).default(1),
  userCount: z.number().int().min(1).default(1),
  price: z.number().min(0).optional(),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  autoRenew: z.boolean().default(false),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'REVOKED', 'SUSPENDED']),
  reason: z.string().optional(),
});

export async function getLicenses(req: Request, res: Response, next: NextFunction) {
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
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { licenseKey: { contains: search, mode: 'insensitive' } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, businessName: true, customerCode: true } },
          installation: { select: { id: true, installationNumber: true } },
          product: { select: { id: true, name: true, productCode: true } },
          plan: { select: { id: true, name: true, planCode: true, billingPeriod: true, price: true } },
          issuedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.license.count({ where }),
    ]);

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const formattedLicenses = licenses.map((lic) => {
      let currentStatus = lic.status;
      if (lic.status === 'ACTIVE') {
        if (lic.expiryDate < now) {
          currentStatus = 'EXPIRED';
        } else if (lic.expiryDate <= thirtyDaysFromNow) {
          currentStatus = 'EXPIRING_SOON';
        }
      }

      return {
        id: lic.id,
        licenseNumber: lic.licenseNumber,
        licenseKey: lic.licenseKey,
        licenseType: lic.licenseType,
        startDate: lic.startDate,
        expiryDate: lic.expiryDate,
        terminalCount: lic.terminalCount,
        userCount: lic.userCount,
        price: lic.price ? Number(lic.price) : 0,
        totalAmount: lic.totalAmount ? Number(lic.totalAmount) : 0,
        status: currentStatus,
        autoRenew: lic.autoRenew,
        customer: lic.customer,
        installation: lic.installation,
        product: lic.product,
        plan: lic.plan ? { ...lic.plan, price: Number(lic.plan.price) } : null,
        issuedBy: lic.issuedBy,
        createdAt: lic.createdAt,
      };
    });

    return res.json({
      success: true,
      data: {
        licenses: formattedLicenses,
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

export async function issueLicense(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = issueLicenseSchema.safeParse(req.body);
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

    // Validate references
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    }

    const installation = await prisma.installation.findUnique({ where: { id: data.installationId } });
    if (!installation) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'POS Installation not found' } });
    }

    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    }

    let planObj = null;
    if (data.planId) {
      planObj = await prisma.productPlan.findUnique({ where: { id: data.planId } });
    }

    // Auto-generate serial license key
    const licenseKey = generateLicenseKey('AQPOS');

    // Auto-generate license number
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const licenseNumber = `LIC-${year}-${randomSeq}`;

    // Dates
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    let expiryDate: Date;

    if (data.expiryDate) {
      expiryDate = new Date(data.expiryDate);
    } else if (planObj) {
      expiryDate = calculateExpiryDate(startDate, planObj.billingPeriod);
    } else {
      expiryDate = calculateExpiryDate(startDate, 'YEARLY');
    }

    // Pricing calculation
    const basePrice = data.price !== undefined ? data.price : planObj ? Number(planObj.price) : 0;
    const totalAmount = basePrice - data.discount + data.tax;

    // Get current logged in user ID (or fallback to admin)
    const userId = req.user?.id || (await prisma.user.findFirst({ where: { status: 'ACTIVE' } }))?.id;

    if (!userId) {
      return res.status(400).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Valid issuer user ID required' } });
    }

    const license = await prisma.license.create({
      data: {
        licenseNumber,
        licenseKey,
        customerId: data.customerId,
        installationId: data.installationId,
        productId: data.productId,
        planId: data.planId || null,
        licenseType: data.licenseType,
        startDate,
        expiryDate,
        terminalCount: data.terminalCount,
        userCount: data.userCount,
        price: basePrice,
        discount: data.discount,
        tax: data.tax,
        totalAmount,
        status: 'ACTIVE',
        autoRenew: data.autoRenew,
        issuedById: userId,
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
        entityType: 'License',
        entityId: license.id,
        action: 'ISSUE',
        newValues: {
          licenseNumber: license.licenseNumber,
          licenseKey: license.licenseKey,
          customer: license.customer.businessName,
          expiryDate: license.expiryDate,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Serial License Key issued successfully',
      data: license,
    });
  } catch (err) {
    next(err);
  }
}

export async function validateLicense(req: Request, res: Response, next: NextFunction) {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'License key parameter is required' },
      });
    }

    const license = await prisma.license.findUnique({
      where: { licenseKey },
      include: {
        customer: { select: { businessName: true, customerCode: true } },
        product: { select: { name: true, version: true } },
        plan: { select: { name: true, maxTerminals: true } },
      },
    });

    if (!license) {
      return res.status(404).json({
        success: false,
        valid: false,
        error: { code: 'INVALID_KEY', message: 'Invalid or unregistered serial license key' },
      });
    }

    const now = new Date();
    const isExpired = license.expiryDate < now;
    const isActiveStatus = license.status === 'ACTIVE' || license.status === 'EXPIRING_SOON';
    const isValid = !isExpired && isActiveStatus;

    return res.json({
      success: true,
      valid: isValid,
      data: {
        licenseNumber: license.licenseNumber,
        licenseKey: license.licenseKey,
        customerName: license.customer.businessName,
        productName: license.product.name,
        planName: license.plan?.name,
        maxTerminals: license.terminalCount,
        expiryDate: license.expiryDate,
        daysRemaining: Math.ceil((license.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        status: isExpired ? 'EXPIRED' : license.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateLicenseStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const existingLicense = await prisma.license.findUnique({ where: { id } });
    if (!existingLicense) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'License key not found' },
      });
    }

    const updatedLicense = await prisma.license.update({
      where: { id },
      data: { status: parseResult.data.status },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'License',
        entityId: id,
        action: 'UPDATE_STATUS',
        oldValues: { status: existingLicense.status },
        newValues: { status: updatedLicense.status, reason: parseResult.data.reason },
      },
    });

    return res.json({
      success: true,
      message: `License status updated to ${updatedLicense.status}`,
      data: updatedLicense,
    });
  } catch (err) {
    next(err);
  }
}
