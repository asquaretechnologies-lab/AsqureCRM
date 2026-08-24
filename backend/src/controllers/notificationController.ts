import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';

/**
 * GET /api/notifications
 * Get user's notifications + unread count
 */
export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const whereCondition = userId
      ? { OR: [{ userId }, { userId: null }] }
      : {};

    const unreadCount = await prisma.notification.count({
      where: {
        ...whereCondition,
        isRead: false,
      },
    });

    const notifications = await prisma.notification.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
export async function markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    const whereCondition = userId
      ? { OR: [{ userId }, { userId: null }] }
      : {};

    await prisma.notification.updateMany({
      where: {
        ...whereCondition,
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/notifications/generate
 * Run system scanner to evaluate and create notifications for:
 * 1. Expiring / Expired Licenses
 * 2. Overdue & Due-Soon Invoices
 * 3. CRM Follow-ups due today or overdue
 */
export async function generateAutomatedNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    let generatedCount = 0;

    // 1. Scan Expiring Licenses (Next 30 Days)
    const expiringLicenses = await prisma.license.findMany({
      where: {
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        expiryDate: { lte: in30Days },
      },
      include: {
        customer: { select: { businessName: true } },
        product: { select: { name: true } },
      },
    });

    for (const lic of expiringLicenses) {
      const diffMs = new Date(lic.expiryDate).getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      const title = daysLeft <= 0 
        ? `License Expired: ${lic.licenseNumber}`
        : `License Expiring in ${daysLeft} Days: ${lic.licenseNumber}`;

      const exists = await prisma.notification.findFirst({
        where: {
          category: 'LICENSE',
          entityId: lic.id,
          title,
        },
      });

      if (!exists) {
        await prisma.notification.create({
          data: {
            title,
            message: `License for ${lic.customer.businessName} (${lic.product.name}) ${daysLeft <= 0 ? 'has expired' : `expires on ${new Date(lic.expiryDate).toLocaleDateString()}`}.`,
            type: daysLeft <= 7 ? 'URGENT' : 'WARNING',
            category: 'LICENSE',
            entityType: 'License',
            entityId: lic.id,
          },
        });
        generatedCount++;
      }
    }

    // 2. Scan Overdue Invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'PAID'] },
        dueDate: { lt: now },
      },
      include: {
        customer: { select: { businessName: true } },
      },
    });

    for (const inv of overdueInvoices) {
      const title = `Overdue Invoice: ${inv.invoiceNumber}`;

      const exists = await prisma.notification.findFirst({
        where: {
          category: 'FINANCE',
          entityId: inv.id,
          title,
        },
      });

      if (!exists) {
        await prisma.notification.create({
          data: {
            title,
            message: `Invoice ${inv.invoiceNumber} for ${inv.customer.businessName} of ₹${Number(inv.balanceAmount).toLocaleString()} is overdue since ${new Date(inv.dueDate).toLocaleDateString()}.`,
            type: 'URGENT',
            category: 'FINANCE',
            entityType: 'Invoice',
            entityId: inv.id,
          },
        });
        generatedCount++;
      }
    }

    // 3. Scan Follow-ups Due Today
    const todaysFollowups = await prisma.activity.findMany({
      where: {
        nextFollowupDate: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        lead: { select: { companyName: true } },
        customer: { select: { businessName: true } },
      },
    });

    for (const act of todaysFollowups) {
      const targetName = act.lead?.companyName || act.customer?.businessName || 'Client';
      const title = `Follow-up Due Today: ${targetName}`;

      const exists = await prisma.notification.findFirst({
        where: {
          category: 'SALES',
          entityId: act.id,
          title,
        },
      });

      if (!exists) {
        await prisma.notification.create({
          data: {
            userId: act.userId,
            title,
            message: `${act.activityType} follow-up scheduled for ${targetName}: ${act.subject}`,
            type: 'INFO',
            category: 'SALES',
            entityType: 'Activity',
            entityId: act.id,
          },
        });
        generatedCount++;
      }
    }

    return res.json({
      success: true,
      message: `Automated notification scan complete. ${generatedCount} new alerts generated.`,
      data: { generatedCount },
    });
  } catch (err) {
    next(err);
  }
}
