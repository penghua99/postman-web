import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DATABASE } from '@server/common/constants/db.constant';
import {
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
} from '@server/database/schema.standalone';
import { hashPassword, verifyPassword } from '@server/common/auth/password';
import { signToken } from '@server/common/auth/jwt';

export interface RegisterDto {
  username: string;
  password: string;
  displayName?: string;
  email?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthUserView {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  avatar: string | null;
  status: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
}

/** 默认注册角色（普通用户） */
export const DEFAULT_USER_ROLE_CODE = 'user';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  // ── 内部辅助 ────────────────────────────────────────────────────

  async getUserRoles(userId: string): Promise<{ id: string; name: string; code: string }[]> {
    return this.db
      .select({
        id: roles.id,
        name: roles.name,
        code: roles.code,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ code: permissions.code })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));
    return rows.map((r) => r.code);
  }

  async toAuthUserView(userId: string): Promise<AuthUserView> {
    const rows = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (rows.length === 0) {
      throw new NotFoundException('用户不存在');
    }
    const user = rows[0];
    const roleRows = await this.getUserRoles(userId);
    const permissionCodes = await this.getUserPermissions(userId);
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      avatar: user.avatar ?? null,
      status: user.status,
      isSuperAdmin: user.isSuperAdmin,
      roles: roleRows.map((r) => r.code),
      permissions: permissionCodes,
    };
  }

  // ── 认证 ────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<{ token: string; user: AuthUserView }> {
    const username = dto.username?.trim();
    const password = dto.password ?? '';
    if (!username || username.length < 3 || username.length > 64) {
      throw new BadRequestException('用户名长度需为 3-64 个字符');
    }
    if (!/^[a-zA-Z0-9_\-.\u4e00-\u9fa5]+$/.test(username)) {
      throw new BadRequestException('用户名只能包含字母、数字、下划线、连字符、点或中文');
    }
    if (password.length < 6) {
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

    const displayName = dto.displayName?.trim() || username;

    const created = await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(users)
        .values({
          username,
          passwordHash: hashPassword(password),
          displayName,
          email: dto.email?.trim() || null,
          status: 'active',
          isSuperAdmin: false,
        })
        .returning();

      // 分配默认「user」角色
      const defaultRole = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.code, DEFAULT_USER_ROLE_CODE))
        .limit(1);
      if (defaultRole.length > 0) {
        await tx.insert(userRoles).values({
          userId: inserted[0].id,
          roleId: defaultRole[0].id,
        });
      }
      return inserted[0];
    });

    const user = await this.toAuthUserView(created.id);
    return { token: this.issueToken(created.id, created.username), user };
  }

  async login(dto: LoginDto): Promise<{ token: string; user: AuthUserView }> {
    const username = dto.username?.trim();
    if (!username || !dto.password) {
      throw new UnauthorizedException('请输入用户名和密码');
    }
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    if (rows.length === 0 || !verifyPassword(dto.password, rows[0].passwordHash)) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const user = rows[0];
    if (user.status !== 'active') {
      throw new ForbiddenException('账号已被禁用，请联系管理员');
    }
    return {
      token: this.issueToken(user.id, user.username),
      user: await this.toAuthUserView(user.id),
    };
  }

  async me(userId: string): Promise<AuthUserView> {
    return this.toAuthUserView(userId);
  }

  issueToken(userId: string, username: string): string {
    return signToken({ sub: userId, username });
  }

  /**
   * 判断用户是否拥有管理权限：超级管理员或具备 admin 角色。
   */
  async hasAdminRole(userId: string): Promise<boolean> {
    const userRows = await this.db
      .select({ isSuperAdmin: users.isSuperAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (userRows.length === 0) return false;
    if (userRows[0].isSuperAdmin) return true;

    const roleRows = await this.db
      .select({ code: roles.code })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(eq(userRoles.userId, userId), eq(roles.code, 'admin')));
    return roleRows.length > 0;
  }

  /**
   * 校验指定 userId 列表是否存在（管理端批量分配角色时使用）。
   */
  async ensureUsersExist(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    const rows = await this.db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, userIds));
    if (rows.length !== userIds.length) {
      throw new BadRequestException('部分用户不存在');
    }
  }
}
