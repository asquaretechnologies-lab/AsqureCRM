import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { generateLicenseKey } from '../utils/licenseGenerator';
import { sendMail } from '../utils/mailer';
import { z } from 'zod';

const MOBILE_SOURCE = 'MOBILE_POS_APP';
const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const emailField = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Valid email is required');

const mobileRegisterSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  displayName: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: emailField,
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

const checkEmailSchema = z.object({ email: emailField });

const verifyOtpSchema = z.object({
  email: emailField,
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function validationError(res: Response, error: z.ZodError) {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: error.errors.map((e) => e.message).join(', '),
    },
  });
}

function findMobileCustomerByEmail(email: string) {
  return prisma.customer.findFirst({
    where: { email: { equals: email, mode: 'insensitive' }, source: MOBILE_SOURCE },
    orderBy: { createdAt: 'asc' },
  });
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  const visible = user.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(user.length - 2, 1))}@${domain}`;
}

type OtpIssueResult = { sent: true } | { sent: false; retryAfterSeconds: number };

/** Generates a 6-digit OTP, stores its hash, and emails it (rate limited per email). */
async function issueOtp(email: string, businessName: string): Promise<OtpIssueResult> {
  const latest = await prisma.mobileOtp.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });
  if (latest) {
    const elapsed = (Date.now() - latest.createdAt.getTime()) / 1000;
    if (elapsed < OTP_RESEND_COOLDOWN_SECONDS) {
      return { sent: false, retryAfterSeconds: Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed) };
    }
  }

  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const otpHash = await bcrypt.hash(otp, 10);

  // Invalidate previous unused OTPs for this email
  await prisma.mobileOtp.updateMany({
    where: { email, consumed: false },
    data: { consumed: true },
  });

  await prisma.mobileOtp.create({
    data: {
      email,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  await sendMail(
    email,
    'Your Asqure Mobile POS login code',
    `Your OTP for ${businessName} is ${otp}. It is valid for ${OTP_TTL_MINUTES} minutes. Do not share it with anyone.`,
    `<p>Your OTP for <b>${businessName}</b> is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>It is valid for ${OTP_TTL_MINUTES} minutes. Do not share it with anyone.</p>`
  );

  return { sent: true };
}

/** Response sent when an email is already registered: an OTP is required to load details. */
async function respondOtpRequired(res: Response, email: string, businessName: string, status = 200) {
  const result = await issueOtp(email, businessName);
  return res.status(status).json({
    success: true,
    message: result.sent
      ? 'Email already registered. OTP sent to the registered email.'
      : 'Email already registered. An OTP was sent recently, please wait before requesting again.',
    data: {
      registered: true,
      otpSent: result.sent,
      maskedEmail: maskEmail(email),
      otpExpiresInSeconds: OTP_TTL_MINUTES * 60,
      ...(result.sent ? {} : { retryAfterSeconds: result.retryAfterSeconds }),
    },
  });
}

/** Builds the full payload the mobile POS needs to load: customer, outlets, installations, licenses. */
async function buildMobilePosDetails(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      outlets: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
        include: {
          installations: {
            orderBy: { createdAt: 'desc' },
            include: {
              product: true,
              licenses: { orderBy: { createdAt: 'desc' } },
            },
          },
        },
      },
    },
  });
  if (!customer) return null;

  const now = Date.now();
  const outlets = customer.outlets.map((outlet) => {
    const installation = outlet.installations[0] || null;
    const license =
      installation?.licenses.find((l) => l.status === 'ACTIVE') || installation?.licenses[0] || null;

    return {
      id: outlet.id,
      outletCode: outlet.outletCode,
      outletName: outlet.outletName,
      addressLine1: outlet.addressLine1,
      addressLine2: outlet.addressLine2,
      city: outlet.city,
      state: outlet.state,
      country: outlet.country,
      postalCode: outlet.postalCode,
      contactPerson: outlet.contactPerson,
      phone: outlet.phone,
      email: outlet.email,
      status: outlet.status,
      installation: installation && {
        id: installation.id,
        installationNumber: installation.installationNumber,
        terminalCount: installation.terminalCount,
        status: installation.status,
      },
      product: installation && {
        id: installation.product.id,
        name: installation.product.name,
        productCode: installation.product.productCode,
        version: installation.product.version,
      },
      license: license && {
        licenseKey: license.licenseKey,
        licenseNumber: license.licenseNumber,
        licenseType: license.licenseType,
        status: license.status,
        startDate: license.startDate,
        expiryDate: license.expiryDate,
        terminalCount: license.terminalCount,
        daysRemaining: Math.max(0, Math.ceil((license.expiryDate.getTime() - now) / 86_400_000)),
        isExpired: license.expiryDate.getTime() < now,
      },
    };
  });

  return {
    registered: true,
    customer: {
      id: customer.id,
      customerCode: customer.customerCode,
      businessName: customer.businessName,
      displayName: customer.displayName,
      phone: customer.phone,
      email: customer.email,
      taxNumber: customer.taxNumber,
      addressLine1: customer.addressLine1,
      addressLine2: customer.addressLine2,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      postalCode: customer.postalCode,
      status: customer.status,
    },
    outlets,
  };
}

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /check-email
 * Checks whether the email is registered. If yes, sends an OTP to that email.
 */
export async function checkMobileEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const parseResult = checkEmailSchema.safeParse(req.body);
    if (!parseResult.success) return validationError(res, parseResult.error);

    const { email } = parseResult.data;
    const customer = await findMobileCustomerByEmail(email);

    if (!customer) {
      return res.json({
        success: true,
        message: 'Email not registered. Proceed with registration.',
        data: { registered: false },
      });
    }

    return respondOtpRequired(res, email, customer.businessName);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /verify-otp
 * Verifies the OTP and returns customer + outlet + license details for the mobile POS.
 */
export async function verifyMobileOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const parseResult = verifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) return validationError(res, parseResult.error);

    const { email, otp } = parseResult.data;
    const invalid = () =>
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' },
      });

    const record = await prisma.mobileOtp.findFirst({
      where: { email, consumed: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!record || record.expiresAt.getTime() < Date.now()) return invalid();

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await prisma.mobileOtp.update({ where: { id: record.id }, data: { consumed: true } });
      return res.status(429).json({
        success: false,
        error: { code: 'OTP_ATTEMPTS_EXCEEDED', message: 'Too many attempts. Please request a new OTP.' },
      });
    }

    const matches = await bcrypt.compare(otp, record.otpHash);
    if (!matches) {
      await prisma.mobileOtp.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return invalid();
    }

    await prisma.mobileOtp.update({ where: { id: record.id }, data: { consumed: true } });

    const customer = await findMobileCustomerByEmail(email);
    const details = customer && (await buildMobilePosDetails(customer.id));
    if (!details) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Registered customer not found' },
      });
    }

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      data: details,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /register
 * Registers a new mobile POS customer. If the email is already registered,
 * an OTP is sent instead (details are returned only after /verify-otp).
 */
export async function registerMobilePos(req: Request, res: Response, next: NextFunction) {
  try {
    const parseResult = mobileRegisterSchema.safeParse(req.body);
    if (!parseResult.success) return validationError(res, parseResult.error);

    const data = parseResult.data;

    // 1. If email already registered → require OTP, do not create duplicates
    const existing = await findMobileCustomerByEmail(data.email);
    if (existing) {
      return respondOtpRequired(res, data.email, existing.businessName);
    }

    // Get an active user to assign as issuer (or system default)
    const issuer = await prisma.user.findFirst({ where: { status: 'ACTIVE' } });
    if (!issuer) {
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'No active system user found to issue license' },
      });
    }

    // 2. Create Customer
    const codeSeq = Math.floor(1000 + Math.random() * 9000);
    const customerCode = `CUST-MB-${codeSeq}`;

    const customer = await prisma.customer.create({
      data: {
        customerCode,
        businessName: data.businessName,
        displayName: data.displayName || data.businessName,
        customerType: 'RETAIL_MOBILE',
        businessType: 'Mobile POS',
        phone: data.phone || null,
        email: data.email,
        taxNumber: data.taxNumber || null,
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || 'India',
        postalCode: data.postalCode || null,
        source: MOBILE_SOURCE,
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
          email: data.email,
          isPrimary: true,
          contactType: 'MOBILE_POS_OWNER',
        },
      });
    }

    // 3. Create Outlet for Mobile POS
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
        email: data.email,
        status: 'ACTIVE',
      },
    });

    // 4. Get or default Product
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

    // 5. Create Installation
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

    // 6. Generate Serial License Key
    const licenseKey = generateLicenseKey('AQPOS');
    const year = now.getFullYear();
    const licSeq = Math.floor(1000 + Math.random() * 9000);
    const licenseNumber = `LIC-${year}-${licSeq}`;

    const startDate = new Date();
    const expiryDate = new Date(startDate.getTime());
    expiryDate.setDate(expiryDate.getDate() + data.validityDays);

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

    // 7. Audit Log
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

    const details = await buildMobilePosDetails(customer.id);

    return res.status(201).json({
      success: true,
      message: 'Mobile POS registered successfully and serial license key generated',
      data: details,
    });
  } catch (err) {
    next(err);
  }
}
