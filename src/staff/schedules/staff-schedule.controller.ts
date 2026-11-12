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
import { Request } from 'express';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { CreateStaffScheduleDto } from './dto/create-staff-schedule.dto.js';
import { UpdateStaffScheduleDto } from './dto/update-staff-schedule.dto.js';
import { UpdateStaffScheduleStatusDto } from './dto/update-staff-schedule-status.dto.js';
import { StaffScheduleService } from './staff-schedule.service.js';

interface AuthenticatedRequest extends Request {
    user?: {
        sub: string;
        role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
        tokenVersion: number;
    };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class StaffScheduleController {
    constructor(
        private readonly staffScheduleService: StaffScheduleService,
    ) {}

    private authorizeAdmin(request: AuthenticatedRequest): void {
        if (request.user?.role !== 'ADMIN') {
            throw new ForbiddenException(
                'You do not have permission to perform this action',
            );
        }
    }

    @Post('staff/:staffId/schedules')
    create(
        @Param('staffId', ParseUUIDPipe) staffId: string,
        @Body() dto: CreateStaffScheduleDto,
        @Req() request: AuthenticatedRequest,
    ) {
        this.authorizeAdmin(request);

        return this.staffScheduleService.create(staffId, dto);
    }

    @Get('staff/:staffId/schedules')
    findAll(
        @Param('staffId', ParseUUIDPipe) staffId: string,
        @Req() request: AuthenticatedRequest,
    ) {
        this.authorizeAdmin(request);

        return this.staffScheduleService.findAll(staffId);
    }

    @Patch('staff/:staffId/schedules/:scheduleId')
    update(
        @Param('staffId', ParseUUIDPipe) staffId: string,
        @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
        @Body() dto: UpdateStaffScheduleDto,
        @Req() request: AuthenticatedRequest,
    ) {
        this.authorizeAdmin(request);

        return this.staffScheduleService.update(
            staffId,
            scheduleId,
            dto,
        );
    }

    @Patch('staff/:staffId/schedules/:scheduleId/status')
    updateStatus(
        @Param('staffId', ParseUUIDPipe) staffId: string,
        @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
        @Body() dto: UpdateStaffScheduleStatusDto,
        @Req() request: AuthenticatedRequest,
    ) {
        this.authorizeAdmin(request);

        return this.staffScheduleService.updateStatus(
            staffId,
            scheduleId,
            dto.isActive,
        );
    }
}