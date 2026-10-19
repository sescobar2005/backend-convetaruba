import { CanActivate, ExecutionContext, Injectable, ParseUUIDPipe, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service.js';

interface AuthenticatedRequest extends Request{
  user?: {
    sub: string;
    role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
    tokenVersion: number;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService
  ){}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Missing access token');
    }

    let payload: {
      sub: string;
      role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
      tokenVersion: number;
    };

    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (
      typeof payload.sub !== 'string' ||
      !['CUSTOMER', 'STAFF', 'ADMIN'].includes(payload.role) ||
      !Number.isInteger(payload.tokenVersion) ||
      payload.tokenVersion < 0
    ) {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.prismaService.client.user.findUnique({
      where: { idUser: payload.sub },
      select: { tokenVersion: true }
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Access token is no longer valid');
    }

    request.user = payload;

    return true;
  }
}
