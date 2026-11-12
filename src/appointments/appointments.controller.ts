import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { StaffBranchService } from '../staff/branches/staff-branch.service.js';

import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { GetAppointmentAvailabilityDto } from './dto/get-appointment-availability.dto.js';
import { GetBranchAppointmentsDto } from './dto/get-branch-appointments.dto.js';
import { ConfirmAppointmentDto } from './dto/confirm-appointment.dto.js';
import { RejectAppointmentDto } from './dto/reject-appointment.dto.js';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto.js';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto.js';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto.js';
import { ChangeVeterinarianDto } from './dto/change-veterinarian.dto.js';

import { AppointmentsService } from './services/appointments.service.js';

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
        private readonly staffBranchService: StaffBranchService,
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

    @Get('customer/:customerId')
    async getCustomerAppointments(
        @Param('customerId', new ParseUUIDPipe()) customerId: string,
        @Req() request: AuthenticatedRequest,
    ) {
        this.authorizeStaffAccess(request);

        const requestingUserId = this.getAuthenticatedUserId(request);

        const appointments =
            await this.appointmentsService.getCustomerAppointments(
                customerId,
                requestingUserId,
                true,
            );

        if (request.user?.role === 'ADMIN') {
            return appointments;
        }

        const authorizedAppointments = [];

        for (const appointment of appointments) {
            const hasAccess =
                await this.staffBranchService.hasActiveBranchAssignment(
                    requestingUserId,
                    appointment.branchId,
                );

            if (hasAccess) {
                authorizedAppointments.push(appointment);
            }
        }

        return authorizedAppointments;
    }

    @Get('branch/:branchId')
    async getBranchAppointments(
        @Param('branchId', new ParseUUIDPipe()) branchId: string,
        @Query() filters: GetBranchAppointmentsDto,
        @Req() request: AuthenticatedRequest,
    ) {
        await this.authorizeBranchAccess(request, branchId);

        return this.appointmentsService.getBranchAppointments(
            branchId,
            filters,
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
    async createAppointmentForCustomer(
        @Param('customerId', new ParseUUIDPipe()) customerId: string,
        @Body() dto: CreateAppointmentDto,
        @Req() request: AuthenticatedRequest,
    ) {
        await this.authorizeBranchAccess(request, dto.branchId);

        return this.appointmentsService.createAppointment(
            customerId,
            this.getAuthenticatedUserId(request),
            dto,
        );
    }

    @Get(':appointmentId/history')
    async getAppointmentHistory(
        @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const appointment = await this.getAuthorizedAppointment(
            request,
            appointmentId,
        );

        return this.appointmentsService.getAppointmentHistory(
            appointment.idAppointment,
            this.getAuthenticatedUserId(request),
            this.isStaff(request),
        );
    }

    @Patch(':appointmentId/confirm')
    async confirmAppointment(
        @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
        @Body() dto: ConfirmAppointmentDto,
        @Req() request: AuthenticatedRequest,
    ) {
        await this.getStaffAppointment(request, appointmentId);

        return this.appointmentsService.confirmAppointment(
            appointmentId,
            this.getAuthenticatedUserId(request),
            dto,
        );
    }

    @Patch(':appointmentId/reject')
    async rejectAppointment(
        @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
        @Body() dto: RejectAppointmentDto,
        @Req() request: AuthenticatedRequest,
    ) {
        await this.getStaffAppointment(request, appointmentId);

        return this.appointmentsService.rejectAppointment(
            appointmentId,
            this.getAuthenticatedUserId(request),
            dto,
        );
    }

    @Patch(':appointmentId/cancel')
    async cancelAppointment(
        @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
        @Body() dto: CancelAppointmentDto,
        @Req() request: AuthenticatedRequest,
    ) {
        await this.getAuthorizedAppointment(request, appointmentId);

        return this.appointmentsService.cancelAppointment(
            appointmentId,
            this.getAuthenticatedUserId(request),
            dto,
        );
    }

    @Patch(':appointmentId/start')
    async startAppointment(
        @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const appointment = await this.getStaffAppointment(
            request,
            appointmentId,
        );

        const userId = this.getAuthenticatedUserId(request);

        if (appointment.veterinarian.userId !== userId) {
            throw new ForbiddenException(
                'Only the assigned veterinarian can start this appointment',
            );
        }

        return this.appointmentsService.startAppointment(
            appointmentId,
            userId,
        );
    }

    @Patch(':appointmentId/complete')
    async completeAppointment(
        @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
        @Body() dto: CompleteAppointmentDto,
        @Req() request: AuthenticatedRequest,
    ) {
        await this.getStaffAppointment(request, appointmentId);

        return this.appointmentsService.completeAppointment(
            appointmentId,
            this.getAuthenticatedUserId(request),
            dto,
        );
    }

    @Patch(':appointmentId/reschedule')
    async rescheduleAppointment(
        @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
        @Body() dto: RescheduleAppointmentDto,
        @Req() request: AuthenticatedRequest,
    ) {
        await this.getAuthorizedAppointment(request, appointmentId);

        if (request.user?.role === 'STAFF') {
            await this.authorizeBranchAccess(request, dto.branchId);
        }

        return this.appointmentsService.rescheduleAppointment(
            appointmentId,
            this.getAuthenticatedUserId(request),
            this.isStaff(request),
            dto,
        );
    }

    @Patch(':appointmentId/veterinarian')
    async changeVeterinarian(
        @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
        @Body() dto: ChangeVeterinarianDto,
        @Req() request: AuthenticatedRequest,
    ) {
        await this.getStaffAppointment(request, appointmentId);

        return this.appointmentsService.changeVeterinarian(
            appointmentId,
            this.getAuthenticatedUserId(request),
            dto,
        );
    }

    @Get(':appointmentId')
    getAppointmentById(
        @Param('appointmentId', new ParseUUIDPipe()) appointmentId: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.getAuthorizedAppointment(
            request,
            appointmentId,
        );
    }

    private getAuthenticatedUserId(
        request: AuthenticatedRequest,
    ): string {
        const userId = request.user?.sub;

        if (!userId) {
            throw new UnauthorizedException(
                'User identity is missing',
            );
        }

        return userId;
    }

    private isStaff(
        request: AuthenticatedRequest,
    ): boolean {
        const role = request.user?.role;

        return role === 'STAFF' || role === 'ADMIN';
    }

    private authorizeStaffAccess(
        request: AuthenticatedRequest,
    ): void {
        if (!this.isStaff(request)) {
            throw new ForbiddenException(
                'Only staff and administrators can perform this operation',
            );
        }
    }

    private async authorizeBranchAccess(
        request: AuthenticatedRequest,
        branchId: string,
    ): Promise<void> {
        this.authorizeStaffAccess(request);

        if (request.user?.role === 'ADMIN') {
            return;
        }

        const hasAccess =
            await this.staffBranchService.hasActiveBranchAssignment(
                this.getAuthenticatedUserId(request),
                branchId,
            );

        if (!hasAccess) {
            throw new ForbiddenException(
                'You do not have an active assignment to this branch',
            );
        }
    }

    private async getAuthorizedAppointment(
        request: AuthenticatedRequest,
        appointmentId: string,
    ) {
        const userId = this.getAuthenticatedUserId(request);
        const staff = this.isStaff(request);

        const appointment =
            await this.appointmentsService.getAppointmentById(
                appointmentId,
                userId,
                staff,
            );

        if (request.user?.role === 'STAFF') {
            await this.authorizeBranchAccess(
                request,
                appointment.branchId,
            );
        }

        return appointment;
    }

    private async getStaffAppointment(
        request: AuthenticatedRequest,
        appointmentId: string,
    ) {
        this.authorizeStaffAccess(request);

        return this.getAuthorizedAppointment(
            request,
            appointmentId,
        );
    }
}