import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { verifyToken } from './jwt';

export interface AuthenticatedUser {
  id: string;
  username: string;
}

// 扩展 Express Request，注入认证后的用户信息
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * JWT 认证守卫：解析 `Authorization: Bearer <token>`，
 * 校验通过后把用户信息挂到 `req.user`。
 * 所有需要登录的业务接口都应挂载本守卫。
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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
    request.user = { id: payload.sub, username: payload.username };
    return true;
  }
}

export {};
