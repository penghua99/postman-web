import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DATABASE } from '@server/common/constants/db.constant';
import {
  roles,
  permissions,
  rolePermissions,
  userRoles,
} from '@server/database/schema.standalone';

export interface CreateRoleDto {
  name: string;
  code: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface AdminRoleView {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isBuiltin: boolean;
  createdAt: Date;
  permissionIds: string[];
}

@Injectable()
export class AdminRolesService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ── 列表 ────────────────────────────────────────────────────────

  async list(): Promise<AdminRoleView[]> {
    const roleRows = await this.db
      .select()
      .from(roles)
      .orderBy(asc(roles.createdAt));

    const views: AdminRoleView[] = [];
    for (const row of roleRows) {
      const permissionRows = await this.db
        .select({ permissionId: rolePermissions.permissionId })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, row.id));
      views.push({
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description ?? null,
        isBuiltin: row.isBuiltin,
        createdAt: row.createdAt,
        permissionIds: permissionRows.map((p) => p.permissionId),
      });
    }
    return views;
  }

  // ── 创建 ────────────────────────────────────────────────────────

  async create(dto: CreateRoleDto): Promise<AdminRoleView> {
    const name = dto.name?.trim();
    const code = dto.code?.trim();
    if (!name || !code) {
      throw new BadRequestException('角色名称和编码不能为空');
    }
    if (!/^[a-z0-9_\-]+$/.test(code)) {
      throw new BadRequestException('角色编码只能包含小写字母、数字、下划线和连字符');
    }
    const existing = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.code, code))
      .limit(1);
    if (existing.length > 0) {
      throw new ConflictException('角色编码已存在');
    }

    const created = await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(roles)
        .values({
          name,
          code,
          description: dto.description?.trim() || null,
          isBuiltin: false,
        })
        .returning();
      const permissionIds = dto.permissionIds ?? [];
      if (permissionIds.length > 0) {
        await this.assignPermissions(tx, inserted[0].id, permissionIds);
      }
      return inserted[0];
    });

    return this.getById(created.id);
  }

  // ── 更新 ────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateRoleDto): Promise<AdminRoleView> {
    await this.getRow(id);

    const patch: Partial<typeof roles.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name?.trim();
    if (dto.description !== undefined) patch.description = dto.description?.trim() || null;

    if (Object.keys(patch).length > 0) {
      await this.db.update(roles).set(patch).where(eq(roles.id, id));
    }

    if (dto.permissionIds !== undefined) {
      await this.db.transaction(async (tx) => {
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
        if (dto.permissionIds!.length > 0) {
          await this.assignPermissions(tx, id, dto.permissionIds!);
        }
      });
    }

    return this.getById(id);
  }

  // ── 删除 ────────────────────────────────────────────────────────

  async remove(id: string): Promise<void> {
    const row = await this.getRow(id);
    if (row.isBuiltin) {
      throw new BadRequestException('内置角色不能删除');
    }
    await this.db.transaction(async (tx) => {
      await tx.delete(userRoles).where(eq(userRoles.roleId, id));
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
      await tx.delete(roles).where(eq(roles.id, id));
    });
  }

  // ── 内部辅助 ────────────────────────────────────────────────────

  private async getRow(id: string): Promise<typeof roles.$inferSelect> {
    const rows = await this.db.select().from(roles).where(eq(roles.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('角色不存在');
    }
    return rows[0];
  }

  async getById(id: string): Promise<AdminRoleView> {
    const row = await this.getRow(id);
    const permissionRows = await this.db
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, id));
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description ?? null,
      isBuiltin: row.isBuiltin,
      createdAt: row.createdAt,
      permissionIds: permissionRows.map((p) => p.permissionId),
    };
  }

  private async assignPermissions(
    tx: PostgresJsDatabase,
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const permRows = await tx
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.id, permissionIds));
    if (permRows.length !== permissionIds.length) {
      throw new BadRequestException('部分权限不存在');
    }
    await tx
      .insert(rolePermissions)
      .values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
  }
}
