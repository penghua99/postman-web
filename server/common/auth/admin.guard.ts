import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '@server/modules/auth/auth.service';
import { verifyToken } from './jwt';

/**
 * 管理端守卫：先校验 JWT 登录，再校验用户是否具备管理权限
 * （超级管理员或拥有 admin 角色）。
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('未登录或登录已过期');
    }
    const token = authHeader.slice(7).trim();
    const payload = verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }

    const isAdmin = await this.authService.hasAdminRole(payload.sub);
    if (!isAdmin) {
      throw new ForbiddenException('无管理端访问权限');
    }
    request.user = { id: payload.sub, username: payload.username };
    return true;
  }
}
