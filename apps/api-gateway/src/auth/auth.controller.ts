import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { Public } from '@app/common';
import { JwtGuard } from '@app/common';
import { CurrentUser } from '@app/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private get cookieSecure(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private get cookieMaxAge(): number {
    return this.configService.get<number>('JWT_REFRESH_EXPIRY_MS', 7 * 24 * 60 * 60 * 1000);
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: this.cookieSecure,
      sameSite: this.configService.get<string>('COOKIE_SAMESITE', 'lax') as 'lax' | 'strict' | 'none',
      maxAge: this.cookieMaxAge,
      path: '/',
    });
  }

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user, refreshToken: result.refreshToken };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user, refreshToken: result.refreshToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies?.refresh_token as string | undefined) || (req.body?.refreshToken as string | undefined);

    if (!token) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refreshToken(token);
    this.setRefreshCookie(res, result.refreshToken);

    return { accessToken: result.accessToken, user: result.user, refreshToken: result.refreshToken };
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id);

    res.clearCookie('refresh_token', { path: '/' });

    return { success: true };
  }
}
