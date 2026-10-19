import { Body, Controller, Post, Get, Param, Patch, ParseUUIDPipe, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateEmailDto } from './dto/update-email.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
    user? : {
        sub: string;
        role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
    };
}

@Controller('users')
export class UsersController {
    constructor(private usersService : UsersService){}

    @Post()
    create(@Body() createUserDto: CreateUserDto){
        return this.usersService.createUser(createUserDto);
    }

    @Get(':idUser')
    findById(@Param('idUser', new ParseUUIDPipe()) idUser: string){
        return this.usersService.findById(idUser);
    }

    @Patch(':idUser')
    updateProfile(
        @Param('idUser', new ParseUUIDPipe()) idUser: string,
        @Body() dto: UpdateProfileDto
    ){
        return this.usersService.updateProfile(idUser, dto);
    }

    @Patch(':idUser/email')
    updateEmail(
        @Param('idUser', new ParseUUIDPipe()) idUser: string,
        @Body() dto: UpdateEmailDto
    ){
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
}
