import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticates user and returns JWT access token.',
  })
  @ApiOkResponse({
    description: 'User successfully authenticated.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password.',
  })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { accessToken, refreshToken } = await this.authService.login(
      dto.email,
      dto.password,
    );

    return {
      success: true,
      accessToken,
      refreshToken,
    };
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken?: string) {
    const tokens = await this.authService.refresh(refreshToken);

    return {
      success: true,
      ...tokens,
    };
  }

  @Post('logout')
  logout(@Body('refreshToken') refreshToken?: string) {
    return this.authService.logout(refreshToken);
  }

  // TODO: ограничить доступ к /login только с frontend server(помоему не обязателньо)
}
