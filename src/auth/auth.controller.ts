import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/LoginDto.js';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
    user?: {
        sub: string;
        role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
        tokenVersion: number;
    };
}

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@Req() request: AuthenticatedRequest) {
        const user = request.user;

        if (!user) {
            throw new UnauthorizedException('User identity is missing');
        }

        return this.authService.getMe(user.sub);
    }
}