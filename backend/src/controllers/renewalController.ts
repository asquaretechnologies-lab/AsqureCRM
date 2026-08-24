import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { calculateExpiryDate } from '../utils/licenseGenerator';
import { z } from 'zod';

const renewLicenseSchema = z.object({
  licenseId: z.string().uuid('Valid license ID is required'),
  renewalMonths: z.number().int().min(1).default(12),
  amount: z.number().min(0, 'Amount must be non-negative'),
  newExpiryDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function getRenewals(req: Request, res: Response, next: NextFunction) {
  try {
    const [renewals, expiringLicenses] = await Promise.all([
      prisma.licenseRenewal.findMany({
        orderBy: { renewalDate: 'desc' },
        include: {
          license: {
            select: {
              id: true,
              licenseNumber: true,
              licenseKey: true,
              customer: { select: { id: true, businessName: true, customerCode: true } },
              product: { select: { id: true, name: true } },
            },
          },
          renewedBy: { select: { id: true, name: true } },
        },
      }),
      // Expiring Queue (Next 60 Days)
      prisma.license.findMany({
        where: {
          status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
          expiryDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { expiryDate: 'asc' },
        include: {
          customer: { select: { id: true, businessName: true, customerCode: true, phone: true, email: true } },
          product: { select: { id: true, name: true } },
          plan: { select: { id: true, name: true, price: true, billingPeriod: true } },
        },
      }),
    ]);

    const formattedRenewals = renewals.map((r) => ({
      id: r.id,
      licenseId: r.licenseId,
      licenseNumber: r.license?.licenseNumber,
      licenseKey: r.license?.licenseKey,
      customerName: r.license?.customer?.businessName,
      productName: r.license?.product?.name,
      previousExpiryDate: r.previousExpiryDate,
      newExpiryDate: r.newExpiryDate,
      amount: Number(r.amount),
      renewalDate: r.renewalDate,
      renewedBy: r.renewedBy?.name,
      notes: r.notes,
    }));

    const now = new Date();
    const formattedExpiring = expiringLicenses.map((lic) => ({
      id: lic.id,
      licenseNumber: lic.licenseNumber,
      licenseKey: lic.licenseKey,
      customerName: lic.customer.businessName,
      customerPhone: lic.customer.phone,
      customerEmail: lic.customer.email,
      productName: lic.product.name,
      planName: lic.plan?.name,
      planPrice: lic.plan ? Number(lic.plan.price) : Number(lic.price || 0),
      expiryDate: lic.expiryDate,
      daysRemaining: Math.ceil((lic.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      status: lic.status,
    }));

    return res.json({
      success: true,
      data: {
        renewals: formattedRenewals,
        expiringQueue: formattedExpiring,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function renewLicense(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = renewLicenseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const { licenseId, renewalMonths, amount, newExpiryDate, notes } = parseResult.data;

    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: {
        customer: { select: { businessName: true } },
        plan: true,
      },
    });

    if (!license) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'License key not found' },
      });
    }

    const previousExpiryDate = license.expiryDate;
    let computedNewExpiryDate: Date;

    if (newExpiryDate) {
      computedNewExpiryDate = new Date(newExpiryDate);
    } else {
      // Extend from current expiry or current date, whichever is later
      const baseDate = previousExpiryDate > new Date() ? previousExpiryDate : new Date();
      computedNewExpiryDate = calculateExpiryDate(baseDate, license.plan?.billingPeriod || 'YEARLY');
    }

    const userId = req.user?.id || (await prisma.user.findFirst({ where: { status: 'ACTIVE' } }))?.id;

    if (!userId) {
      return res.status(400).json({ success: false, error: { code: 'AUTH_ERROR', message: 'User authentication required for renewal' } });
    }

    // Execute atomic transaction
    const [renewalRecord, updatedLicense] = await prisma.$transaction([
      prisma.licenseRenewal.create({
        data: {
          licenseId,
          previousExpiryDate,
          newExpiryDate: computedNewExpiryDate,
          amount,
          renewedById: userId,
          renewalDate: new Date(),
          notes,
        },
      }),
      prisma.license.update({
        where: { id: licenseId },
        data: {
          expiryDate: computedNewExpiryDate,
          status: 'ACTIVE',
        },
      }),
    ]);

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'LicenseRenewal',
        entityId: renewalRecord.id,
        action: 'RENEW_LICENSE',
        newValues: {
          licenseNumber: license.licenseNumber,
          customer: license.customer.businessName,
          previousExpiry: previousExpiryDate,
          newExpiry: computedNewExpiryDate,
          amount,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: `License ${license.licenseNumber} renewed successfully until ${computedNewExpiryDate.toLocaleDateString()}`,
      data: {
        renewal: renewalRecord,
        license: updatedLicense,
      },
    });
  } catch (err) {
    next(err);
  }
}
