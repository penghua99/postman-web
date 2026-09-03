import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DATABASE } from '@server/common/constants/db.constant';
import {
  users,
  roles,
  userRoles,
} from '@server/database/schema.standalone';
import { hashPassword } from '@server/common/auth/password';
import { AuthService } from '@server/modules/auth/auth.service';

export interface CreateUserDto {
  username: string;
  password: string;
  displayName?: string;
  email?: string;
  status?: string;
  roleIds?: string[];
}

export interface UpdateUserDto {
  displayName?: string;
  email?: string;
  status?: string;
  roleIds?: string[];
}

export interface ResetPasswordDto {
  password: string;
}

export interface AdminUserView {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  avatar: string | null;
  status: string;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: { id: string; name: string; code: string }[];
}

@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly authService: AuthService,
  ) {}

  // ── 列表（分页 + 搜索） ─────────────────────────────────────────

  async list(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
  }): Promise<{ items: AdminUserView[]; total: number }> {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(params.pageSize) || 20, 1), 100);
    const keyword = params.keyword?.trim();
    const status = params.status?.trim();

    const conditions: (SQL<unknown> | undefined)[] = [];
    if (keyword) {
      conditions.push(
        or(
          ilike(users.username, `%${keyword}%`),
          ilike(users.displayName, `%${keyword}%`),
          ilike(users.email, `%${keyword}%`),
        ),
      );
    }
    if (status) {
      conditions.push(eq(users.status, status));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRows, userRows] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(where),
      this.db
        .select()
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    const items: AdminUserView[] = [];
    for (const row of userRows) {
      const roleRows = await this.authService.getUserRoles(row.id);
      items.push({
        id: row.id,
        username: row.username,
        displayName: row.displayName ?? null,
        email: row.email ?? null,
        avatar: row.avatar ?? null,
        status: row.status,
        isSuperAdmin: row.isSuperAdmin,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        roles: roleRows,
      });
    }
    return { items, total };
  }

  // ── 创建 ────────────────────────────────────────────────────────

  async create(dto: CreateUserDto): Promise<AdminUserView> {
    const username = dto.username?.trim();
    if (!username || username.length < 3) {
      throw new BadRequestException('用户名长度至少 3 个字符');
    }
    if (!/^[a-zA-Z0-9_\-.\u4e00-\u9fa5]+$/.test(username)) {
      throw new BadRequestException('用户名只能包含字母、数字、下划线、连字符、点或中文');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('密码长度至少 6 位');
    }

    const existing = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    if (existing.length > 0) {
      throw new ConflictException('用户名已存在');
    }

    const created = await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(users)
        .values({
          username,
          passwordHash: hashPassword(dto.password),
          displayName: dto.displayName?.trim() || username,
          email: dto.email?.trim() || null,
          status: dto.status === 'disabled' ? 'disabled' : 'active',
          isSuperAdmin: false,
        })
        .returning();

      const roleIds = dto.roleIds ?? [];
      if (roleIds.length > 0) {
        await this.assignRoles(tx, inserted[0].id, roleIds);
      }
      return inserted[0];
    });

    return this.getById(created.id);
  }

  // ── 更新 ────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateUserDto): Promise<AdminUserView> {
    const target = await this.getRow(id);

    const patch: Partial<typeof users.$inferInsert> = {};
    if (dto.displayName !== undefined) patch.displayName = dto.displayName?.trim() || null;
    if (dto.email !== undefined) patch.email = dto.email?.trim() || null;
    if (dto.status !== undefined) {
      if (target.isSuperAdmin && dto.status === 'disabled') {
        throw new BadRequestException('不能禁用超级管理员');
      }
      patch.status = dto.status === 'disabled' ? 'disabled' : 'active';
    }
    patch.updatedAt = new Date();

    await this.db.update(users).set(patch).where(eq(users.id, id));

    if (dto.roleIds !== undefined) {
      await this.db.transaction(async (tx) => {
        await tx.delete(userRoles).where(eq(userRoles.userId, id));
        if (dto.roleIds!.length > 0) {
          await this.assignRoles(tx, id, dto.roleIds!);
        }
      });
    }

    return this.getById(id);
  }

  // ── 重置密码 ────────────────────────────────────────────────────

  async resetPassword(id: string, dto: ResetPasswordDto): Promise<void> {
    await this.getRow(id);
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('密码长度至少 6 位');
    }
    await this.db
      .update(users)
      .set({ passwordHash: hashPassword(dto.password), updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  // ── 删除 ────────────────────────────────────────────────────────

  async remove(id: string, operatorId: string): Promise<void> {
    if (id === operatorId) {
      throw new BadRequestException('不能删除当前登录账号');
    }
    const target = await this.getRow(id);
    if (target.isSuperAdmin) {
      throw new BadRequestException('不能删除超级管理员');
    }
    await this.db.delete(users).where(eq(users.id, id));
  }

  // ── 内部辅助 ────────────────────────────────────────────────────

  private async getRow(id: string): Promise<typeof users.$inferSelect> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('用户不存在');
    }
    return rows[0];
  }

  async getById(id: string): Promise<AdminUserView> {
    const row = await this.getRow(id);
    const roleRows = await this.authService.getUserRoles(id);
    return {
      id: row.id,
      username: row.username,
      displayName: row.displayName ?? null,
      email: row.email ?? null,
      avatar: row.avatar ?? null,
      status: row.status,
      isSuperAdmin: row.isSuperAdmin,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      roles: roleRows,
    };
  }

  private async assignRoles(
    tx: PostgresJsDatabase,
    userId: string,
    roleIds: string[],
  ): Promise<void> {
    const roleRows = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(inArray(roles.id, roleIds));
    if (roleRows.length !== roleIds.length) {
      throw new BadRequestException('部分角色不存在');
    }
    await tx.insert(userRoles).values(roleIds.map((roleId) => ({ userId, roleId })));
  }
}
