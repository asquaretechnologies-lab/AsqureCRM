import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';

function getStartOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function getStartOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * GET /api/dashboard/management
 * High-level business executive dashboard metrics
 */
export async function getManagementDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const startOfMonth = getStartOfMonth();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const totalCustomers = await prisma.customer.count();
    const newCustomers = await prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } });
    const activeInstallations = await prisma.installation.count({ where: { status: { in: ['ACTIVATED', 'INSTALLED'] } } });
    const activeLicenses = await prisma.license.count({ where: { status: 'ACTIVE' } });
    const expiringLicenses = await prisma.license.count({
      where: {
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        expiryDate: { gte: now, lte: in30Days },
      },
    });
    const expiredLicenses = await prisma.license.count({
      where: { OR: [{ status: 'EXPIRED' }, { expiryDate: { lt: now } }] },
    });
    const monthlyRevenueAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paymentDate: { gte: startOfMonth } },
    });
    const totalOutstandingAgg = await prisma.invoice.aggregate({
      _sum: { balanceAmount: true },
      where: { status: { notIn: ['CANCELLED', 'PAID'] } },
    });
    const totalOverdueAgg = await prisma.invoice.aggregate({
      _sum: { balanceAmount: true },
      where: {
        status: { notIn: ['CANCELLED', 'PAID'] },
        dueDate: { lt: now },
      },
    });
    const openTickets = await prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } });

    const recentInstallations = await prisma.installation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, businessName: true, customerCode: true } },
        outlet: { select: { id: true, outletName: true } },
        product: { select: { id: true, name: true } },
      },
    });

    const recentRenewals = await prisma.licenseRenewal.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        license: {
          include: {
            customer: { select: { id: true, businessName: true } },
            product: { select: { id: true, name: true } },
          },
        },
        renewedBy: { select: { id: true, name: true } },
      },
    });

    return res.json({
      success: true,
      data: {
        metrics: {
          totalCustomers,
          newCustomers,
          activeInstallations,
          activeLicenses,
          expiringLicenses,
          expiredLicenses,
          monthlyRevenue: Number(monthlyRevenueAgg._sum.amount || 0),
          totalOutstanding: Number(totalOutstandingAgg._sum.balanceAmount || 0),
          totalOverdue: Number(totalOverdueAgg._sum.balanceAmount || 0),
          openTickets,
        },
        recentInstallations: recentInstallations.map((i) => ({
          id: i.id,
          installationNumber: i.installationNumber,
          customerName: i.customer.businessName,
          outletName: i.outlet.outletName,
          productName: i.product.name,
          version: i.version,
          status: i.status,
          createdAt: i.createdAt,
        })),
        recentRenewals: recentRenewals.map((r) => ({
          id: r.id,
          licenseNumber: r.license.licenseNumber,
          customerName: r.license.customer.businessName,
          productName: r.license.product.name,
          amount: Number(r.amount),
          newExpiryDate: r.newExpiryDate,
          renewedByName: r.renewedBy.name,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/sales
 * Sales & CRM lead pipeline operational metrics
 */
export async function getSalesDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const startOfToday = getStartOfToday();
    const endOfToday = getEndOfToday();

    const newLeads = await prisma.lead.count({ where: { status: 'NEW' } });
    const openLeads = await prisma.lead.count({ where: { status: { notIn: ['WON', 'LOST'] } } });
    const demosCount = await prisma.activity.count({ where: { activityType: 'DEMO' } });
    const quotationsCount = await prisma.lead.count({ where: { status: 'PROPOSAL' } });
    const wonLeads = await prisma.lead.count({ where: { status: 'WON' } });
    const lostLeads = await prisma.lead.count({ where: { status: 'LOST' } });
    const expectedRevenueAgg = await prisma.lead.aggregate({
      _sum: { expectedValue: true },
      where: { status: { notIn: ['WON', 'LOST'] } },
    });

    const todaysFollowups = await prisma.activity.findMany({
      where: {
        nextFollowupDate: { gte: startOfToday, lte: endOfToday },
      },
      take: 10,
      orderBy: { nextFollowupDate: 'asc' },
      include: {
        lead: { select: { id: true, companyName: true, leadNumber: true, contactName: true, phone: true } },
        customer: { select: { id: true, businessName: true, customerCode: true } },
        user: { select: { id: true, name: true } },
      },
    });

    const recentLeads = await prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    const pipelineBreakdown = await prisma.lead.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { expectedValue: true },
    });

    const formattedPipeline = pipelineBreakdown.map((item) => ({
      status: item.status,
      count: item._count._all,
      value: Number(item._sum.expectedValue || 0),
    }));

    return res.json({
      success: true,
      data: {
        metrics: {
          newLeads,
          openLeads,
          demosCount,
          quotationsCount,
          wonLeads,
          lostLeads,
          expectedRevenue: Number(expectedRevenueAgg._sum.expectedValue || 0),
          todayFollowupsCount: todaysFollowups.length,
        },
        pipeline: formattedPipeline,
        todaysFollowups: todaysFollowups.map((act) => ({
          id: act.id,
          activityType: act.activityType,
          subject: act.subject,
          nextFollowupDate: act.nextFollowupDate,
          companyOrCustomer: act.lead?.companyName || act.customer?.businessName || 'N/A',
          contactPerson: act.lead?.contactName || 'N/A',
          phone: act.lead?.phone || 'N/A',
          userName: act.user.name,
        })),
        recentLeads: recentLeads.map((l) => ({
          id: l.id,
          leadNumber: l.leadNumber,
          companyName: l.companyName,
          contactName: l.contactName,
          expectedValue: Number(l.expectedValue || 0),
          status: l.status,
          assignedToName: l.assignedTo?.name || 'Unassigned',
          createdAt: l.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/accounts
 * Financial, Invoicing, Payment & Outstanding Aging Metrics
 */
export async function getAccountsDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const startOfToday = getStartOfToday();
    const endOfToday = getEndOfToday();
    const startOfMonth = getStartOfMonth();

    const totalInvoices = await prisma.invoice.count();
    const totalPayments = await prisma.payment.count();
    const todaysCollectionAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paymentDate: { gte: startOfToday, lte: endOfToday } },
    });
    const monthlyCollectionAgg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paymentDate: { gte: startOfMonth } },
    });
    const totalOutstandingAgg = await prisma.invoice.aggregate({
      _sum: { balanceAmount: true },
      where: { status: { notIn: ['CANCELLED', 'PAID'] } },
    });
    const totalOverdueAgg = await prisma.invoice.aggregate({
      _sum: { balanceAmount: true },
      where: {
        status: { notIn: ['CANCELLED', 'PAID'] },
        dueDate: { lt: now },
      },
    });

    const unpaidInvoices = await prisma.invoice.findMany({
      where: { status: { notIn: ['CANCELLED', 'PAID'] } },
      select: { balanceAmount: true, dueDate: true },
    });

    const overdueInvoicesList = await prisma.invoice.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'PAID'] },
        dueDate: { lt: now },
      },
      take: 5,
      orderBy: { balanceAmount: 'desc' },
      include: {
        customer: { select: { id: true, businessName: true, customerCode: true } },
      },
    });

    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { paymentDate: 'desc' },
      include: {
        customer: { select: { id: true, businessName: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
    });

    const aging = {
      days0To30: 0,
      days31To60: 0,
      days61To90: 0,
      days90Plus: 0,
    };

    unpaidInvoices.forEach((inv) => {
      const balance = Number(inv.balanceAmount);
      const diffTime = now.getTime() - new Date(inv.dueDate).getTime();
      const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (overdueDays <= 30) {
        aging.days0To30 += balance;
      } else if (overdueDays <= 60) {
        aging.days31To60 += balance;
      } else if (overdueDays <= 90) {
        aging.days61To90 += balance;
      } else {
        aging.days90Plus += balance;
      }
    });

    return res.json({
      success: true,
      data: {
        metrics: {
          totalInvoices,
          totalPayments,
          todaysCollection: Number(todaysCollectionAgg._sum.amount || 0),
          monthlyCollection: Number(monthlyCollectionAgg._sum.amount || 0),
          totalOutstanding: Number(totalOutstandingAgg._sum.balanceAmount || 0),
          totalOverdue: Number(totalOverdueAgg._sum.balanceAmount || 0),
          aging,
        },
        overdueInvoices: overdueInvoicesList.map((inv) => {
          const diffTime = now.getTime() - new Date(inv.dueDate).getTime();
          const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customer.businessName,
            customerCode: inv.customer.customerCode,
            totalAmount: Number(inv.totalAmount),
            balanceAmount: Number(inv.balanceAmount),
            dueDate: inv.dueDate,
            daysOverdue,
          };
        }),
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          receiptNumber: p.receiptNumber,
          customerName: p.customer.businessName,
          invoiceNumber: p.invoice.invoiceNumber,
          amount: Number(p.amount),
          paymentMethod: p.paymentMethod,
          paymentDate: p.paymentDate,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/dashboard/support
 * Customer Support Ticket Operations & Performance
 */
export async function getSupportDashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const startOfToday = getStartOfToday();
    const userId = req.user?.id;

    const openTicketsCount = await prisma.ticket.count({ where: { status: 'OPEN' } });
    const inProgressTicketsCount = await prisma.ticket.count({ where: { status: 'IN_PROGRESS' } });
    const criticalTicketsCount = await prisma.ticket.count({
      where: {
        priority: { in: ['HIGH', 'URGENT'] },
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });
    const unassignedTicketsCount = await prisma.ticket.count({
      where: {
        assignedToId: null,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });

    const myTicketsCount = userId
      ? await prisma.ticket.count({
          where: {
            assignedToId: userId,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
          },
        })
      : 0;

    const resolvedTodayCount = await prisma.ticket.count({
      where: {
        status: 'RESOLVED',
        resolvedAt: { gte: startOfToday },
      },
    });

    const resolvedTickets = await prisma.ticket.findMany({
      where: { resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
      take: 50,
    });

    const recentTicketsList = await prisma.ticket.findMany({
      take: 5,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        customer: { select: { id: true, businessName: true, customerCode: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    let avgResolutionTimeHours = 0;
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((sum, t) => {
        if (!t.resolvedAt) return sum;
        const diffMs = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
        return sum + diffMs / (1000 * 60 * 60);
      }, 0);
      avgResolutionTimeHours = Number((totalHours / resolvedTickets.length).toFixed(1));
    }

    return res.json({
      success: true,
      data: {
        metrics: {
          openTickets: openTicketsCount,
          inProgressTickets: inProgressTicketsCount,
          criticalTickets: criticalTicketsCount,
          unassignedTickets: unassignedTicketsCount,
          myTickets: myTicketsCount,
          resolvedToday: resolvedTodayCount,
          avgResolutionTimeHours,
        },
        recentTickets: recentTicketsList.map((t) => ({
          id: t.id,
          ticketNumber: t.ticketNumber,
          subject: t.subject,
          category: t.category,
          priority: t.priority,
          status: t.status,
          customerName: t.customer.businessName,
          assignedToName: t.assignedTo?.name || 'Unassigned',
          createdAt: t.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}
