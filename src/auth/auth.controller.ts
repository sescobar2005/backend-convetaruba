import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.js';
import { LoginDto } from './dto/LoginDto.js';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard.js';

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