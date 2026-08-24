import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { prisma } from '../config/prisma';

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
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
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Your user account has been deactivated',
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const signOptions: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as unknown as SignOptions['expiresIn'],
    };

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      signOptions
    );

    const permissions = user.role.rolePermissions.map(
      (rp) => `${rp.permission.module}:${rp.permission.action}`
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          employeeCode: user.employeeCode,
          name: user.name,
          email: user.email,
          role: user.role.name,
          permissions,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        employeeCode: user.employeeCode,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: req.user.roleName,
        permissions: req.user.permissions,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response) {
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
}
