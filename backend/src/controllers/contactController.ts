import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createContactSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  name: z.string().min(1, 'Name is required'),
  designation: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  contactType: z.string().optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
});

const updateContactSchema = createContactSchema.partial();

export async function getContacts(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId } = req.query;

    const where: any = {};
    if (customerId) {
      where.customerId = customerId as string;
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      include: {
        customer: { select: { id: true, businessName: true, customerCode: true } },
      },
    });

    return res.json({
      success: true,
      data: contacts,
    });
  } catch (err) {
    next(err);
  }
}

export async function createContact(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createContactSchema.safeParse(req.body);
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

    // If setting as primary, unset other primary contacts for this customer
    if (data.isPrimary) {
      await prisma.contact.updateMany({
        where: { customerId: data.customerId },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.contact.create({
      data: {
        customerId: data.customerId,
        name: data.name,
        designation: data.designation,
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: data.email || null,
        contactType: data.contactType,
        isPrimary: data.isPrimary,
        notes: data.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Contact',
        entityId: contact.id,
        action: 'CREATE',
        newValues: { name: contact.name, isPrimary: contact.isPrimary },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Contact added successfully',
      data: contact,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateContact(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parseResult = updateContactSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const existingContact = await prisma.contact.findUnique({ where: { id } });
    if (!existingContact) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Contact not found' },
      });
    }

    const data = parseResult.data;

    if (data.isPrimary) {
      await prisma.contact.updateMany({
        where: { customerId: existingContact.customerId },
        data: { isPrimary: false },
      });
    }

    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        ...data,
        email: data.email === '' ? null : data.email,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Contact',
        entityId: id,
        action: 'UPDATE',
        newValues: { name: updatedContact.name, isPrimary: updatedContact.isPrimary },
      },
    });

    return res.json({
      success: true,
      message: 'Contact updated successfully',
      data: updatedContact,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteContact(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const existingContact = await prisma.contact.findUnique({ where: { id } });
    if (!existingContact) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Contact not found' },
      });
    }

    await prisma.contact.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Contact',
        entityId: id,
        action: 'DELETE',
        oldValues: { name: existingContact.name },
      },
    });

    return res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
