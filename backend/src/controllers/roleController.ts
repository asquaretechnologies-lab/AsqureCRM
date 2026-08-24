import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
});

const updateRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid('Valid permission ID is required')),
});

export async function getRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            rolePermissions: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        status: r.status,
        userCount: r._count.users,
        permissionCount: r._count.rolePermissions,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getPermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    // Group permissions by module
    const grouped: Record<string, typeof permissions> = {};
    for (const p of permissions) {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push(p);
    }

    return res.json({
      success: true,
      data: {
        total: permissions.length,
        permissions,
        grouped,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getRolePermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const { roleId } = req.params;

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          select: {
            permissionId: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Role not found' },
      });
    }

    const permissionIds = role.rolePermissions.map((rp) => rp.permissionId);

    return res.json({
      success: true,
      data: {
        roleId: role.id,
        roleName: role.name,
        permissionIds,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parseResult = createRoleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const { name, description } = parseResult.data;

    const existingRole = await prisma.role.findUnique({ where: { name } });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_RECORD', message: 'Role with this name already exists' },
      });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        status: 'ACTIVE',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Role',
        entityId: role.id,
        action: 'CREATE',
        newValues: { name: role.name, description: role.description },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateRolePermissions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { roleId } = req.params;
    const parseResult = updateRolePermissionsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Role not found' },
      });
    }

    const { permissionIds } = parseResult.data;

    // Use transaction to replace role permissions atomically
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing role permissions
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // 2. Insert new role permissions
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        entityType: 'Role',
        entityId: roleId,
        action: 'UPDATE_PERMISSIONS',
        newValues: { permissionCount: permissionIds.length },
      },
    });

    return res.json({
      success: true,
      message: `Updated permissions for role ${role.name}`,
      data: {
        roleId: role.id,
        roleName: role.name,
        permissionCount: permissionIds.length,
      },
    });
  } catch (err) {
    next(err);
  }
}
