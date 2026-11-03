import { Injectable } from '@nestjs/common';
import { AppointmentAvailabilityService } from './appointment-availability.service.js';
import { AppointmentHistoryService } from './appointment-history.service.js';
import { AppointmentExpirationService } from './appointment-expiration.service.js';
import { AppointmentQueryService } from './appointment-query.service.js';
import { AppointmentLifecycleService } from './lifecycle/appointment-lifecycle.service.js';
import { AppointmentSchedulingService } from './scheduling/appointment-scheduling.service.js';

@Injectable()
export class AppointmentsService {
    constructor(
        private readonly availabilityService: AppointmentAvailabilityService,
        private readonly lifecycleService: AppointmentLifecycleService,
        private readonly schedulingService: AppointmentSchedulingService,
        private readonly historyService: AppointmentHistoryService,
        private readonly expirationService: AppointmentExpirationService,
        private readonly queryService: AppointmentQueryService,
    ) {}

    // Availability
    async getAvailability(...args: Parameters<AppointmentAvailabilityService['getAvailability']>) {
        return this.availabilityService.getAvailability(...args);
    }

    // Appointment creation and scheduling
    async createAppointment(...args: Parameters<AppointmentSchedulingService['createAppointment']>) {
        return this.schedulingService.createAppointment(...args);
    }

    async changeVeterinarian(...args: Parameters<AppointmentSchedulingService['changeVeterinarian']>) {
        return this.schedulingService.changeVeterinarian(...args);
    }

    async rescheduleAppointment(...args: Parameters<AppointmentSchedulingService['rescheduleAppointment']>) {
        return this.schedulingService.rescheduleAppointment(...args);
    }

    // Appointment lifecycle
    async confirmAppointment(...args: Parameters<AppointmentLifecycleService['confirmAppointment']>) {
        return this.lifecycleService.confirmAppointment(...args);
    }

    async rejectAppointment(...args: Parameters<AppointmentLifecycleService['rejectAppointment']>) {
        return this.lifecycleService.rejectAppointment(...args);
    }

    async cancelAppointment(...args: Parameters<AppointmentLifecycleService['cancelAppointment']>) {
        return this.lifecycleService.cancelAppointment(...args);
    }

    async startAppointment(...args: Parameters<AppointmentLifecycleService['startAppointment']>) {
        return this.lifecycleService.startAppointment(...args);
    }

    async completeAppointment(...args: Parameters<AppointmentLifecycleService['completeAppointment']>) {
        return this.lifecycleService.completeAppointment(...args);
    }

    // Appointment queries
    async getAppointmentById(...args: Parameters<AppointmentQueryService['getAppointmentById']>) {
        return this.queryService.getAppointmentById(...args);
    }

    async getCustomerAppointments(...args: Parameters<AppointmentQueryService['getCustomerAppointments']>) {
        return this.queryService.getCustomerAppointments(...args);
    }

    async getBranchAppointments(...args: Parameters<AppointmentQueryService['getBranchAppointments']>) {
        return this.queryService.getBranchAppointments(...args);
    }

    // Appointment history
    async getAppointmentHistory(...args: Parameters<AppointmentHistoryService['getAppointmentHistory']>) {
        return this.historyService.getAppointmentHistory(...args);
    }

    // Expiration
    async expireAppointments() {
        return this.expirationService.expireAppointments();
    }
}