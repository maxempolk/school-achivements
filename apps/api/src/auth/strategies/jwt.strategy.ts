import { getRequiredEnv } from '@/env';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

type JwtPayload = {
  sub: number;
  email: string;
  role: Role;
  isSuperAdmin?: boolean;
};

const cookieExtractor = (req: Request): string | null => {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const accessToken = cookies?.access_token;

  return typeof accessToken === 'string' ? accessToken : null;
};

const isProduction = process.env.NODE_ENV === 'production';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ...(isProduction ? [] : [ExtractJwt.fromAuthHeaderAsBearerToken()]),
      ]),
      ignoreExpiration: false,
      secretOrKey: getRequiredEnv('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      isSuperAdmin: payload.isSuperAdmin ?? false,
    };
  }
}
