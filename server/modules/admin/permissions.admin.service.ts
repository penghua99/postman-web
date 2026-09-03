import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DATABASE } from '@server/common/constants/db.constant';
import {
  permissions,
  rolePermissions,
} from '@server/database/schema.standalone';

export interface CreatePermissionDto {
  name: string;
  code: string;
  description?: string;
  group?: string;
}

export interface UpdatePermissionDto {
  name?: string;
  description?: string;
  group?: string;
}

export interface AdminPermissionView {
  id: string;
  name: string;
  code: string;
  description: string | null;
  group: string | null;
  createdAt: Date;
}

@Injectable()
export class AdminPermissionsService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async list(): Promise<AdminPermissionView[]> {
    const rows = await this.db
      .select()
      .from(permissions)
      .orderBy(asc(permissions.group), asc(permissions.createdAt));
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description ?? null,
      group: row.group ?? null,
      createdAt: row.createdAt,
    }));
  }

  async create(dto: CreatePermissionDto): Promise<AdminPermissionView> {
    const name = dto.name?.trim();
    const code = dto.code?.trim();
    if (!name || !code) {
      throw new BadRequestException('权限名称和编码不能为空');
    }
    const existing = await this.db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.code, code))
      .limit(1);
    if (existing.length > 0) {
      throw new ConflictException('权限编码已存在');
    }
    const rows = await this.db
      .insert(permissions)
      .values({
        name,
        code,
        description: dto.description?.trim() || null,
        group: dto.group?.trim() || null,
      })
      .returning();
    return this.toView(rows[0]);
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<AdminPermissionView> {
    await this.getRow(id);
    const patch: Partial<typeof permissions.$inferInsert> = {};
    if (dto.name !== undefined) patch.name = dto.name?.trim();
    if (dto.description !== undefined) patch.description = dto.description?.trim() || null;
    if (dto.group !== undefined) patch.group = dto.group?.trim() || null;
    if (Object.keys(patch).length === 0) {
      return this.getById(id);
    }
    const rows = await this.db
      .update(permissions)
      .set(patch)
      .where(eq(permissions.id, id))
      .returning();
    return this.toView(rows[0]);
  }

  async remove(id: string): Promise<void> {
    await this.getRow(id);
    await this.db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq(rolePermissions.permissionId, id));
      await tx.delete(permissions).where(eq(permissions.id, id));
    });
  }

  private async getRow(id: string): Promise<typeof permissions.$inferSelect> {
    const rows = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id))
      .limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('权限不存在');
    }
    return rows[0];
  }

  async getById(id: string): Promise<AdminPermissionView> {
    return this.toView(await this.getRow(id));
  }

  private toView(row: typeof permissions.$inferSelect): AdminPermissionView {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description ?? null,
      group: row.group ?? null,
      createdAt: row.createdAt,
    };
  }
}
