import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from './jwt-auth.guard';

/**
 * 取当前登录用户（由 JwtAuthGuard 注入到 req.user）。
 * 用法：@CurrentUser() user: AuthenticatedUser
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (!request.user) {
      throw new Error('当前请求未登录，请先挂载 JwtAuthGuard');
    }
    return request.user;
  },
);

/**
 * 取当前登录用户 ID。
 * 用法：@CurrentUserId() userId: string
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (!request.user?.id) {
      throw new Error('当前请求未登录，请先挂载 JwtAuthGuard');
    }
    return request.user.id;
  },
);
