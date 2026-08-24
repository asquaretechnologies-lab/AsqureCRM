import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createActivitySchema = z.object({
  leadId: z.string().uuid().optional().or(z.literal('')),
  customerId: z.string().uuid().optional().or(z.literal('')),
  activityType: z.enum(['CALL', 'MEETING', 'EMAIL', 'DEMO', 'NOTE']).default('CALL'),
  subject: z.string().min(1, 'Subject line is required'),
  activityDate: z.string().optional(),
  outcome: z.string().optional(),
  nextFollowupDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function getActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const leadId = req.query.leadId as string;
    const customerId = req.query.customerId as string;

    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (customerId) where.customerId = customerId;

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { activityDate: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, leadNumber: true, companyName: true } },
        customer: { select: { id: true, businessName: true } },
      },
    });

    return res.json({
      success: true,
      data: activities,
    });
  } catch (err) {
    next(err);
  }
}

export async function createActivity(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createActivitySchema.safeParse(req.body);
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

    if (!data.leadId && !data.customerId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Activity must be linked to either a Lead or Customer' },
      });
    }

    const userId = req.user?.id || (await prisma.user.findFirst({ where: { status: 'ACTIVE' } }))?.id;

    if (!userId) {
      return res.status(400).json({ success: false, error: { code: 'AUTH_ERROR', message: 'User authentication required' } });
    }

    const activityDate = data.activityDate ? new Date(data.activityDate) : new Date();
    const nextFollowupDate = data.nextFollowupDate ? new Date(data.nextFollowupDate) : null;

    const activity = await prisma.activity.create({
      data: {
        leadId: data.leadId || null,
        customerId: data.customerId || null,
        activityType: data.activityType,
        subject: data.subject,
        activityDate,
        outcome: data.outcome || null,
        nextFollowupDate,
        userId,
        notes: data.notes || null,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Activity',
        entityId: activity.id,
        action: 'LOG_ACTIVITY',
        newValues: {
          activityType: activity.activityType,
          subject: activity.subject,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Sales activity logged successfully',
      data: activity,
    });
  } catch (err) {
    next(err);
  }
}
