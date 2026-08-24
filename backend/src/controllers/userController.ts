import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createUserSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.string().uuid('Valid role ID is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Full name is required').optional(),
  phone: z.string().optional(),
  roleId: z.string().uuid('Valid role ID is required').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const roleId = req.query.roleId as string;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          employeeCode: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        users,
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

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const permissions = user.role.rolePermissions.map(
      (rp) => `${rp.permission.module}:${rp.permission.action}`
    );

    return res.json({
      success: true,
      data: {
        id: user.id,
        employeeCode: user.employeeCode,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
        permissions,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const { employeeCode, name, email, phone, password, roleId, status } = parseResult.data;

    // Check unique email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_RECORD', message: 'User with this email already exists' },
      });
    }

    // Check unique employee code
    const existingEmpCode = await prisma.user.findUnique({ where: { employeeCode } });
    if (existingEmpCode) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_RECORD', message: 'User with this employee code already exists' },
      });
    }

    // Verify role exists
    const roleExists = await prisma.role.findUnique({ where: { id: roleId } });
    if (!roleExists) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Specified role not found' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        employeeCode,
        name,
        email,
        phone,
        passwordHash,
        roleId,
        status,
      },
      include: {
        role: true,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'User',
        entityId: newUser.id,
        action: 'CREATE',
        newValues: {
          employeeCode: newUser.employeeCode,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role.name,
          status: newUser.status,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.id,
        employeeCode: newUser.employeeCode,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        status: newUser.status,
        role: newUser.role.name,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const updateData = parseResult.data;

    if (updateData.roleId) {
      const roleExists = await prisma.role.findUnique({ where: { id: updateData.roleId } });
      if (!roleExists) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Specified role not found' },
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'User',
        entityId: updatedUser.id,
        action: 'UPDATE',
        oldValues: {
          name: existingUser.name,
          phone: existingUser.phone,
          roleId: existingUser.roleId,
          status: existingUser.status,
        },
        newValues: {
          name: updatedUser.name,
          phone: updatedUser.phone,
          roleId: updatedUser.roleId,
          status: updatedUser.status,
        },
      },
    });

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser.id,
        employeeCode: updatedUser.employeeCode,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        status: updatedUser.status,
        role: updatedUser.role.name,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function resetUserPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    const passwordHash = await bcrypt.hash(parseResult.data.password, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'User',
        entityId: id,
        action: 'RESET_PASSWORD',
      },
    });

    return res.json({
      success: true,
      message: `Password reset successfully for user ${existingUser.email}`,
    });
  } catch (err) {
    next(err);
  }
}
