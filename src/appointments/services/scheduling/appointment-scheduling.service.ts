import { Injectable } from '@nestjs/common';
import { AppointmentCreationService } from './appointment-creation.service.js';
import { AppointmentReschedulingService } from './appointment-rescheduling.service.js';
import { AppointmentVeterinarianService } from './appointment-veterinarian.service.js';

@Injectable()
export class AppointmentSchedulingService {
    constructor(
        private readonly creationService: AppointmentCreationService,
        private readonly reschedulingService: AppointmentReschedulingService,
        private readonly veterinarianService: AppointmentVeterinarianService,
    ) {}

    async createAppointment(
        ...args: Parameters<AppointmentCreationService['createAppointment']>
    ) {
        return this.creationService.createAppointment(...args);
    }

    async rescheduleAppointment(
        ...args: Parameters<AppointmentReschedulingService['rescheduleAppointment']>
    ) {
        return this.reschedulingService.rescheduleAppointment(...args);
    }

    async changeVeterinarian(
        ...args: Parameters<AppointmentVeterinarianService['changeVeterinarian']>
    ) {
        return this.veterinarianService.changeVeterinarian(...args);
    }
}