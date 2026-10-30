import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { StaffService } from './staff.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
    user?: {
        sub: string;
        role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
        tokenVersion: number;
    };
}

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
    constructor(
        private readonly staffService: StaffService,
    ) {}

    private authorizeAdmin(request: AuthenticatedRequest): void {
        if (request.user?.role !== 'ADMIN') {
            throw new ForbiddenException(
                'You do not have permission to perform this action',
            );
        }
    }

    @Post()
    create(
        @Req() request: AuthenticatedRequest,
        @Body() createStaffDto: CreateStaffDto,
    ) {
        this.authorizeAdmin(request);

        return this.staffService.createStaff(createStaffDto);
    }

    @Get()
    findAll(
        @Req() request: AuthenticatedRequest,
    ) {
        this.authorizeAdmin(request);

        return this.staffService.findAllStaff();
    }

    @Get(':idStaff')
    findById(
        @Req() request: AuthenticatedRequest,
        @Param('idStaff', new ParseUUIDPipe()) idStaff: string,
    ) {
        this.authorizeAdmin(request);

        return this.staffService.findStaffById(idStaff);
    }

    @Patch(':idStaff')
    update(
        @Req() request: AuthenticatedRequest,
        @Param('idStaff', new ParseUUIDPipe()) idStaff: string,
        @Body() updateStaffDto: UpdateStaffDto,
    ) {
        this.authorizeAdmin(request);

        return this.staffService.updateStaff(idStaff, updateStaffDto);
    }

    @Patch(':idStaff/status')
    updateStatus(
        @Req() request: AuthenticatedRequest,
        @Param('idStaff', new ParseUUIDPipe()) idStaff: string,
        @Body() updateStaffStatusDto: UpdateStaffStatusDto,
    ) {
        this.authorizeAdmin(request);

        return this.staffService.updateStaffStatus(
            idStaff,
            updateStaffStatusDto,
        );
    }
}