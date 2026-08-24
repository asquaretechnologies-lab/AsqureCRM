import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/prisma';

/**
 * GET /api/reports/customer
 * Customer analytics & master reports
 */
export async function getCustomerReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const totalCustomers = await prisma.customer.count();
    const prospects = await prisma.customer.count({ where: { status: 'PROSPECT' } });
    const activeCustomers = await prisma.customer.count({ where: { status: 'ACTIVE' } });
    const inactiveCustomers = await prisma.customer.count({ where: { status: 'INACTIVE' } });

    const byLocation = await prisma.customer.groupBy({
      by: ['city'],
      _count: { _all: true },
      orderBy: { _count: { city: 'desc' } },
      take: 10,
    });

    const byBusinessType = await prisma.customer.groupBy({
      by: ['businessType'],
      _count: { _all: true },
    });

    const customerList = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        customerCode: true,
        businessName: true,
        displayName: true,
        businessType: true,
        city: true,
        state: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true,
        _count: {
          select: { outlets: true, installations: true, licenses: true },
        },
      },
    });

    return res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          prospects,
          activeCustomers,
          inactiveCustomers,
        },
        byLocation: byLocation.map((item) => ({
          city: item.city || 'Unspecified',
          count: item._count._all,
        })),
        byBusinessType: byBusinessType.map((item) => ({
          businessType: item.businessType || 'General',
          count: item._count._all,
        })),
        rows: customerList.map((c) => ({
          id: c.id,
          customerCode: c.customerCode,
          businessName: c.businessName,
          businessType: c.businessType || 'General',
          city: c.city || 'N/A',
          state: c.state || 'N/A',
          phone: c.phone || 'N/A',
          status: c.status,
          outletCount: c._count.outlets,
          installationCount: c._count.installations,
          licenseCount: c._count.licenses,
          createdAt: c.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/installation
 * Installation master & status reports
 */
export async function getInstallationReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const totalInstallations = await prisma.installation.count();
    const activeInstallations = await prisma.installation.count({ where: { status: 'ACTIVATED' } });
    const plannedInstallations = await prisma.installation.count({ where: { status: 'PLANNED' } });
    const suspendedInstallations = await prisma.installation.count({ where: { status: 'SUSPENDED' } });

    const byProduct = await prisma.installation.groupBy({
      by: ['productId'],
      _count: { _all: true },
    });

    const installationList = await prisma.installation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        customer: { select: { businessName: true, customerCode: true } },
        outlet: { select: { outletName: true } },
        product: { select: { name: true, productCode: true } },
        installedBy: { select: { name: true } },
      },
    });

    const products = await prisma.product.findMany({
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p.name]));

    return res.json({
      success: true,
      data: {
        summary: {
          totalInstallations,
          activeInstallations,
          plannedInstallations,
          suspendedInstallations,
        },
        byProduct: byProduct.map((item) => ({
          productName: productMap.get(item.productId) || 'Unknown Product',
          count: item._count._all,
        })),
        rows: installationList.map((i) => ({
          id: i.id,
          installationNumber: i.installationNumber,
          customerName: i.customer.businessName,
          customerCode: i.customer.customerCode,
          outletName: i.outlet.outletName,
          productName: i.product.name,
          version: i.version || '1.0.0',
          terminalCount: i.terminalCount,
          installedDate: i.installationDate,
          installedByName: i.installedBy?.name || 'Unassigned',
          status: i.status,
          createdAt: i.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/license
 * Licensing, expiry, and renewal analytics
 */
export async function getLicenseReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const totalLicenses = await prisma.license.count();
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
    const renewalCount = await prisma.licenseRenewal.count();
    const totalRenewalRevenueAgg = await prisma.licenseRenewal.aggregate({
      _sum: { amount: true },
    });

    const licenseList = await prisma.license.findMany({
      orderBy: { expiryDate: 'asc' },
      take: 100,
      include: {
        customer: { select: { businessName: true, customerCode: true } },
        product: { select: { name: true } },
        plan: { select: { name: true, price: true } },
      },
    });

    return res.json({
      success: true,
      data: {
        summary: {
          totalLicenses,
          activeLicenses,
          expiringLicenses,
          expiredLicenses,
          totalRenewals: renewalCount,
          renewalRevenue: Number(totalRenewalRevenueAgg._sum.amount || 0),
        },
        rows: licenseList.map((l) => ({
          id: l.id,
          licenseNumber: l.licenseNumber,
          customerName: l.customer.businessName,
          productName: l.product.name,
          planName: l.plan?.name || 'Standard',
          licenseType: l.licenseType,
          startDate: l.startDate,
          expiryDate: l.expiryDate,
          totalAmount: Number(l.totalAmount),
          status: l.status,
          autoRenew: l.autoRenew,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/finance
 * Invoices, Payments, Outstanding & Accounts Aging
 */
export async function getFinanceReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const now = new Date();

    const totalInvoices = await prisma.invoice.count();
    const totalBilledAgg = await prisma.invoice.aggregate({ _sum: { totalAmount: true } });
    const totalCollectedAgg = await prisma.payment.aggregate({ _sum: { amount: true } });
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

    const paymentsByMethod = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      _sum: { amount: true },
      _count: { _all: true },
    });

    const unpaidInvoices = await prisma.invoice.findMany({
      where: { status: { notIn: ['CANCELLED', 'PAID'] } },
      select: { balanceAmount: true, dueDate: true },
    });

    const invoiceRows = await prisma.invoice.findMany({
      orderBy: { invoiceDate: 'desc' },
      take: 100,
      include: {
        customer: { select: { businessName: true, customerCode: true } },
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
        summary: {
          totalInvoices,
          totalBilled: Number(totalBilledAgg._sum.totalAmount || 0),
          totalCollected: Number(totalCollectedAgg._sum.amount || 0),
          totalOutstanding: Number(totalOutstandingAgg._sum.balanceAmount || 0),
          totalOverdue: Number(totalOverdueAgg._sum.balanceAmount || 0),
          aging,
        },
        byPaymentMethod: paymentsByMethod.map((item) => ({
          method: item.paymentMethod,
          count: item._count._all,
          totalAmount: Number(item._sum.amount || 0),
        })),
        rows: invoiceRows.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customer.businessName,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          totalAmount: Number(inv.totalAmount),
          amountPaid: Number(inv.amountPaid),
          balanceAmount: Number(inv.balanceAmount),
          status: inv.status,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/sales
 * Leads pipeline & conversion performance
 */
export async function getSalesReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const totalLeads = await prisma.lead.count();
    const wonLeads = await prisma.lead.count({ where: { status: 'WON' } });
    const lostLeads = await prisma.lead.count({ where: { status: 'LOST' } });
    const openLeads = await prisma.lead.count({ where: { status: { notIn: ['WON', 'LOST'] } } });
    const expectedRevenueAgg = await prisma.lead.aggregate({ _sum: { expectedValue: true } });

    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { expectedValue: true },
    });

    const leadList = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        assignedTo: { select: { name: true } },
      },
    });
    const winRate = totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;

    return res.json({
      success: true,
      data: {
        summary: {
          totalLeads,
          wonLeads,
          lostLeads,
          openLeads,
          winRate,
          totalExpectedRevenue: Number(expectedRevenueAgg._sum.expectedValue || 0),
        },
        pipeline: leadsByStatus.map((item) => ({
          status: item.status,
          count: item._count._all,
          value: Number(item._sum.expectedValue || 0),
        })),
        rows: leadList.map((l) => ({
          id: l.id,
          leadNumber: l.leadNumber,
          companyName: l.companyName,
          contactName: l.contactName,
          phone: l.phone || 'N/A',
          city: l.city || 'N/A',
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
 * GET /api/reports/support
 * Customer support ticket volume, category & priority distribution
 */
export async function getSupportReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const totalTickets = await prisma.ticket.count();
    const openTickets = await prisma.ticket.count({ where: { status: 'OPEN' } });
    const inProgressTickets = await prisma.ticket.count({ where: { status: 'IN_PROGRESS' } });
    const resolvedTickets = await prisma.ticket.count({ where: { status: 'RESOLVED' } });
    const closedTickets = await prisma.ticket.count({ where: { status: 'CLOSED' } });

    const byCategory = await prisma.ticket.groupBy({
      by: ['category'],
      _count: { _all: true },
    });

    const byPriority = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: { _all: true },
    });

    const ticketList = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        customer: { select: { businessName: true, customerCode: true } },
        assignedTo: { select: { name: true } },
      },
    });

    return res.json({
      success: true,
      data: {
        summary: {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          closedTickets,
        },
        byCategory: byCategory.map((item) => ({
          category: item.category,
          count: item._count._all,
        })),
        byPriority: byPriority.map((item) => ({
          priority: item.priority,
          count: item._count._all,
        })),
        rows: ticketList.map((t) => ({
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
