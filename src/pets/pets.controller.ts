import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { PetsService } from './pets.service.js';
import { CreatePetDto } from './dto/create-pet.dto.js';
import { UpdatePetDto } from './dto/update-pet.dto.js';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
    tokenVersion: number;
  };
}

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
    constructor(private readonly petsService: PetsService) {}

    @Post()
    createPet(
        @Body() dto: CreatePetDto,
        @Req() request: AuthenticatedRequest,
    ) {
        const ownerId = this.getAuthenticatedUserId(request);
        return this.petsService.createPet(ownerId, dto);
    }

    
    @Post('owner/:ownerId')
    createPetForOwner(
        @Param('ownerId', new ParseUUIDPipe()) ownerId: string,
        @Body() dto: CreatePetDto,
        @Req() request: AuthenticatedRequest,
    ) {
        this.authorizeStaffAccess(request);

        return this.petsService.createPet(ownerId, dto);
    }

    @Get()
    findAllByOwner(@Req() request: AuthenticatedRequest) {
        const ownerId = this.getAuthenticatedUserId(request);
        return this.petsService.findAllByOwner(ownerId);
    }

    @Get('owner/:ownerId')
    findAllByOwnerForStaff(
    @Param('ownerId', new ParseUUIDPipe()) ownerId: string,
    @Req() request: AuthenticatedRequest,
    ) {
    this.authorizeStaffAccess(request);

    return this.petsService.findAllByOwnerForStaff(ownerId);
    }

    @Get('staff/:idPet')
    findByIdForStaff(
        @Param('idPet', new ParseUUIDPipe()) idPet: string,
        @Req() request: AuthenticatedRequest,
    ) {
        this.authorizeStaffAccess(request);

        return this.petsService.findByIdForStaff(idPet);
    }

    @Get(':idPet')
    findById(
        @Param('idPet', new ParseUUIDPipe()) idPet: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const ownerId = this.getAuthenticatedUserId(request);
        return this.petsService.findByIdForOwner(idPet, ownerId);
    }

    @Patch(':idPet')
    updatePet(
        @Param('idPet', new ParseUUIDPipe()) idPet: string,
        @Body() dto: UpdatePetDto,
        @Req() request: AuthenticatedRequest,
    ) {
        const ownerId = this.getAuthenticatedUserId(request);
        return this.petsService.updatePet(idPet, ownerId, dto);
    }

    @Patch(':idPet/deactivate')
    deactivatePet(
        @Param('idPet', new ParseUUIDPipe()) idPet: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const ownerId = this.getAuthenticatedUserId(request);
        return this.petsService.deactivatePet(idPet, ownerId);
    }

    private getAuthenticatedUserId(
        request: AuthenticatedRequest,
        ): string {
        const userId = request.user?.sub;

        if (!userId) {
            throw new UnauthorizedException('User identity is missing');
        }

        return userId;
    }

    private authorizeStaffAccess(
        request: AuthenticatedRequest,
        ): void {
        const role = request.user?.role;

        if (role !== 'STAFF' && role !== 'ADMIN') {
            throw new ForbiddenException(
            'Only staff and administrators can access another owner’s pets',
            );
        }
    }

}