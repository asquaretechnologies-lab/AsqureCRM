import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { generateLicenseKey } from '../utils/licenseGenerator';
import { z } from 'zod';

const mobileRegisterSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  displayName: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  taxNumber: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  outletName: z.string().optional(),
  productId: z.string().uuid().optional().or(z.literal('')),
  licenseType: z.string().default('SUBSCRIPTION'),
  validityDays: z.number().int().min(1).default(365),
  terminalCount: z.number().int().min(1).default(1),
  deviceInfo: z.string().optional(),
});

export async function registerMobilePos(req: Request, res: Response, next: NextFunction) {
  try {
    const parseResult = mobileRegisterSchema.safeParse(req.body);
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

    // 1. Find existing Customer or Create New
    let customer = null;
    if (data.phone) {
      customer = await prisma.customer.findFirst({
        where: { phone: data.phone },
      });
    }
    if (!customer && data.email) {
      customer = await prisma.customer.findFirst({
        where: { email: data.email },
      });
    }
    if (!customer) {
      const codeSeq = Math.floor(1000 + Math.random() * 9000);
      const customerCode = `CUST-MB-${codeSeq}`;

      customer = await prisma.customer.create({
        data: {
          customerCode,
          businessName: data.businessName,
          displayName: data.displayName || data.businessName,
          customerType: 'RETAIL_MOBILE',
          businessType: 'Mobile POS',
          phone: data.phone || null,
          email: data.email || null,
          taxNumber: data.taxNumber || null,
          addressLine1: data.addressLine1 || null,
          addressLine2: data.addressLine2 || null,
          city: data.city || null,
          state: data.state || null,
          country: data.country || 'India',
          postalCode: data.postalCode || null,
          source: 'MOBILE_POS_APP',
          status: 'ACTIVE',
        },
      });

      // Create primary contact if contactName is specified
      if (data.contactName) {
        await prisma.contact.create({
          data: {
            customerId: customer.id,
            name: data.contactName,
            phone: data.phone || null,
            email: data.email || null,
            isPrimary: true,
            contactType: 'MOBILE_POS_OWNER',
          },
        });
      }
    }

    // 2. Create Outlet for Mobile POS
    const outletCodeSeq = Math.floor(1000 + Math.random() * 9000);
    const outletCode = `OUT-MB-${outletCodeSeq}`;
    const outletName = data.outletName || `${data.businessName} - Main Branch`;

    const outlet = await prisma.outlet.create({
      data: {
        customerId: customer.id,
        outletCode,
        outletName,
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || 'India',
        postalCode: data.postalCode || null,
        contactPerson: data.contactName || null,
        phone: data.phone || null,
        email: data.email || null,
        status: 'ACTIVE',
      },
    });

    // 3. Get or default Product
    let product = null;
    if (data.productId) {
      product = await prisma.product.findUnique({ where: { id: data.productId } });
    }
    if (!product) {
      product = await prisma.product.findFirst({ where: { status: 'ACTIVE' } });
    }
    if (!product) {
      // Fallback: create a default Mobile POS Product if none exists in database
      product = await prisma.product.create({
        data: {
          productCode: 'PROD-MBPOS',
          name: 'Asqure Mobile POS',
          description: 'Offline Mobile POS Android App',
          version: 'v1.0.0',
          status: 'ACTIVE',
        },
      });
    }

    // 4. Create Installation
    const instCodeSeq = Math.floor(1000 + Math.random() * 9000);
    const installationNumber = `INST-MB-${instCodeSeq}`;
    const now = new Date();

    const installation = await prisma.installation.create({
      data: {
        installationNumber,
        customerId: customer.id,
        outletId: outlet.id,
        productId: product.id,
        installationDate: now,
        activationDate: now,
        terminalCount: data.terminalCount,
        userCount: 1,
        serverType: 'MOBILE_OFFLINE_POS',
        serverName: data.deviceInfo || 'Mobile POS Device',
        status: 'ACTIVATED',
      },
    });

    // 5. Generate Serial License Key
    const licenseKey = generateLicenseKey('AQPOS');
    const year = now.getFullYear();
    const licSeq = Math.floor(1000 + Math.random() * 9000);
    const licenseNumber = `LIC-${year}-${licSeq}`;

    const startDate = new Date();
    const expiryDate = new Date(startDate.getTime());
    expiryDate.setDate(expiryDate.getDate() + data.validityDays);

    // Get an active user to assign as issuer (or system default)
    const issuer = await prisma.user.findFirst({ where: { status: 'ACTIVE' } });
    if (!issuer) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'No active system user found to issue license' },
      });
    }

    const license = await prisma.license.create({
      data: {
        licenseNumber,
        licenseKey,
        customerId: customer.id,
        installationId: installation.id,
        productId: product.id,
        licenseType: data.licenseType,
        startDate,
        expiryDate,
        terminalCount: data.terminalCount,
        userCount: 1,
        status: 'ACTIVE',
        issuedById: issuer.id,
        notes: `Mobile POS self-registration from device (${data.deviceInfo || 'Offline App'})`,
      },
    });

    // 6. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: issuer.id,
        entityType: 'MobilePOS',
        entityId: license.id,
        action: 'MOBILE_REGISTRATION',
        newValues: {
          customerCode: customer.customerCode,
          outletCode: outlet.outletCode,
          licenseKey: license.licenseKey,
          expiryDate: license.expiryDate,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Mobile POS registered successfully and serial license key generated',
      data: {
        licenseKey: license.licenseKey,
        licenseNumber: license.licenseNumber,
        licenseType: license.licenseType,
        status: license.status,
        startDate: license.startDate,
        expiryDate: license.expiryDate,
        terminalCount: license.terminalCount,
        customer: {
          id: customer.id,
          customerCode: customer.customerCode,
          businessName: customer.businessName,
          displayName: customer.displayName,
          phone: customer.phone,
          email: customer.email,
        },
        outlet: {
          id: outlet.id,
          outletCode: outlet.outletCode,
          outletName: outlet.outletName,
        },
        installation: {
          id: installation.id,
          installationNumber: installation.installationNumber,
        },
        product: {
          id: product.id,
          name: product.name,
          productCode: product.productCode,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
