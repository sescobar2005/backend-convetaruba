import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { AppointmentsService } from './services/appointments.service.js';
import { GetAppointmentAvailabilityDto } from './dto/get-appointment-availability.dto.js';

interface AuthenticatedRequest extends Request {
    user?: {
        sub: string;
        role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
        tokenVersion: number;
    };
}

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
    constructor(
        private readonly appointmentsService: AppointmentsService,
    ) {}

    @Get('availability')
    getAvailability(
        @Query() query: GetAppointmentAvailabilityDto,
    ) {
        return this.appointmentsService.getAvailability(query);
    }

    @Get('mine')
    getMyAppointments(
        @Req() request: AuthenticatedRequest,
    ) {
        const customerId = this.getAuthenticatedUserId(request);

        if (request.user?.role !== 'CUSTOMER') {
            throw new ForbiddenException(
                'Only customers can access their appointments',
            );
        }

        return this.appointmentsService.getCustomerAppointments(
            customerId,
            customerId,
            false,
        );
    }

    @Post()
    createAppointment(
        @Body() dto: CreateAppointmentDto,
        @Req() request: AuthenticatedRequest,
    ) {
        const customerId = this.getAuthenticatedUserId(request);

        if (request.user?.role !== 'CUSTOMER') {
            throw new ForbiddenException(
                'Only customers can create appointments through this endpoint',
            );
        }

        return this.appointmentsService.createAppointment(
            customerId,
            customerId,
            dto,
        );
    }

    @Post('customer/:customerId')
    createAppointmentForCustomer(
        @Param('customerId', new ParseUUIDPipe()) customerId: string,
        @Body() dto: CreateAppointmentDto,
        @Req() request: AuthenticatedRequest,
    ) {
        this.authorizeStaffAccess(request);

        return this.appointmentsService.createAppointment(
            customerId,
            request.user!.sub,
            dto,
        );
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
                'Only staff and administrators can create appointments for customers',
            );
        }
    }
}