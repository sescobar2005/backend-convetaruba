import { Body, Controller, Post, Get, Param, Patch, ParseUUIDPipe, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateEmailDto } from './dto/update-email.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

interface AuthenticatedRequest extends Request {
    user? : {
        sub: string;
        role: UserRole;
        tokenVersion: number;
    };
}

@Controller('users')
export class UsersController {
    constructor(private readonly usersService : UsersService){}

    @Post()
    create(@Body() createUserDto: CreateUserDto){
        return this.usersService.createUser(createUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':idUser')
    findById(
        @Param('idUser', new ParseUUIDPipe()) idUser: string,
        @Req() request: AuthenticatedRequest
    ){
        this.authorizeProfileAccess(idUser, request);

        return this.usersService.findById(idUser);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':idUser')
    updateProfile(
        @Param('idUser', new ParseUUIDPipe()) idUser: string,
        @Body() dto: UpdateProfileDto,
        @Req() request: AuthenticatedRequest
    ){
        this.authorizeProfileAccess(idUser, request);

        return this.usersService.updateProfile(idUser, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':idUser/email')
    updateEmail(
        @Param('idUser', new ParseUUIDPipe()) idUser: string,
        @Body() dto: UpdateEmailDto,
        @Req() request: AuthenticatedRequest
    ){
        this.authorizeProfileAccess(idUser, request);

        return this.usersService.updateEmail(idUser, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':idUser/password')
    changePassword(
        @Param('idUser', new ParseUUIDPipe()) idUser: string,
        @Body() dto: ChangePasswordDto,
        @Req() request: AuthenticatedRequest
    ){
        if (request.user?.sub !== idUser) {
            throw new ForbiddenException('You can only change your own password');
        }
        
        return this.usersService.changePassword(idUser, dto);
    }

    private authorizeProfileAccess(
        idUser: string,
        request: AuthenticatedRequest
    ): void {
        const authenticatedUser = request.user;

        if (!authenticatedUser) {
            throw new ForbiddenException('User identity is missing');
        }

        const isOwnProfile = authenticatedUser.sub === idUser;
        const hasElevatedRole =
            authenticatedUser.role === 'STAFF' ||
            authenticatedUser.role === 'ADMIN';

        if (!isOwnProfile && !hasElevatedRole) {
            throw new ForbiddenException('You can only access your own profile');
        }
    }
}