import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createProductSchema = z.object({
  productCode: z.string().min(1, 'Product code is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

const updateProductSchema = createProductSchema.partial();

const createPlanSchema = z.object({
  productId: z.string().uuid('Valid product ID is required'),
  planCode: z.string().min(1, 'Plan code is required'),
  name: z.string().min(1, 'Plan name is required'),
  billingPeriod: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'LIFETIME']).default('YEARLY'),
  price: z.number().min(0, 'Price must be non-negative'),
  maxTerminals: z.number().int().min(1).default(1),
  maxUsers: z.number().int().min(1).default(1),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

const updatePlanSchema = createPlanSchema.partial();

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: {
        plans: {
          orderBy: { price: 'asc' },
        },
        _count: {
          select: {
            installations: true,
            licenses: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: products.map((p) => ({
        id: p.id,
        productCode: p.productCode,
        name: p.name,
        description: p.description,
        version: p.version,
        status: p.status,
        installationCount: p._count.installations,
        licenseCount: p._count.licenses,
        plans: p.plans.map((plan) => ({
          id: plan.id,
          planCode: plan.planCode,
          name: plan.name,
          billingPeriod: plan.billingPeriod,
          price: Number(plan.price),
          maxTerminals: plan.maxTerminals,
          maxUsers: plan.maxUsers,
          description: plan.description,
          status: plan.status,
        })),
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createProductSchema.safeParse(req.body);
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

    const existingCode = await prisma.product.findUnique({ where: { productCode: data.productCode } });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_RECORD', message: 'Product code already exists' },
      });
    }

    const product = await prisma.product.create({
      data: {
        productCode: data.productCode,
        name: data.name,
        description: data.description,
        version: data.version,
        status: data.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Product',
        entityId: product.id,
        action: 'CREATE',
        newValues: { productCode: product.productCode, name: product.name },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parseResult = updateProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: parseResult.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Product',
        entityId: id,
        action: 'UPDATE',
        newValues: { name: updatedProduct.name, status: updatedProduct.status },
      },
    });

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (err) {
    next(err);
  }
}

export async function createProductPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createPlanSchema.safeParse(req.body);
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

    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Parent product not found' },
      });
    }

    const existingPlan = await prisma.productPlan.findUnique({
      where: {
        productId_planCode: {
          productId: data.productId,
          planCode: data.planCode,
        },
      },
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_RECORD', message: 'Plan code already exists for this product' },
      });
    }

    const plan = await prisma.productPlan.create({
      data: {
        productId: data.productId,
        planCode: data.planCode,
        name: data.name,
        billingPeriod: data.billingPeriod,
        price: data.price,
        maxTerminals: data.maxTerminals,
        maxUsers: data.maxUsers,
        description: data.description,
        status: data.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'ProductPlan',
        entityId: plan.id,
        action: 'CREATE',
        newValues: { planCode: plan.planCode, name: plan.name, price: Number(plan.price) },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Product plan created successfully',
      data: plan,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProductPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { planId } = req.params;
    const parseResult = updatePlanSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const existingPlan = await prisma.productPlan.findUnique({ where: { id: planId } });
    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product plan not found' },
      });
    }

    const updatedPlan = await prisma.productPlan.update({
      where: { id: planId },
      data: parseResult.data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'ProductPlan',
        entityId: planId,
        action: 'UPDATE',
        newValues: { name: updatedPlan.name, price: Number(updatedPlan.price) },
      },
    });

    return res.json({
      success: true,
      message: 'Product plan updated successfully',
      data: updatedPlan,
    });
  } catch (err) {
    next(err);
  }
}
