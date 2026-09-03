import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@server/common/auth/jwt-auth.guard';
import { CurrentUser } from '@server/common/auth/current-user.decorator';
import type { AuthenticatedUser } from '@server/common/auth/jwt-auth.guard';
import { AuthService } from './auth.service';
import type { AuthUserView, LoginDto, RegisterDto } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ token: string; user: AuthUserView }> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
  ): Promise<{ token: string; user: AuthUserView }> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserView> {
    return this.authService.me(user.id);
  }
}
