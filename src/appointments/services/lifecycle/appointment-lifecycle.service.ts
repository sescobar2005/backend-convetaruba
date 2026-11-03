import { Injectable } from '@nestjs/common';
import { AppointmentConfirmationService } from './appointment-confirmation.service.js';
import { AppointmentRejectionService } from './appointment-rejection.service.js';
import { AppointmentCancellationService } from './appointment-cancellation.service.js';
import { AppointmentStartService } from './appointment-start.service.js';
import { AppointmentCompletionService } from './appointment-completion.service.js';

@Injectable()
export class AppointmentLifecycleService {
    constructor(
        private readonly confirmationService: AppointmentConfirmationService,
        private readonly rejectionService: AppointmentRejectionService,
        private readonly cancellationService: AppointmentCancellationService,
        private readonly startService: AppointmentStartService,
        private readonly completionService: AppointmentCompletionService,
    ) {}

    async confirmAppointment(
        ...args: Parameters<AppointmentConfirmationService['confirmAppointment']>
    ) {
        return this.confirmationService.confirmAppointment(...args);
    }

    async rejectAppointment(
        ...args: Parameters<AppointmentRejectionService['rejectAppointment']>
    ) {
        return this.rejectionService.rejectAppointment(...args);
    }

    async cancelAppointment(
        ...args: Parameters<AppointmentCancellationService['cancelAppointment']>
    ) {
        return this.cancellationService.cancelAppointment(...args);
    }

    async startAppointment(
        ...args: Parameters<AppointmentStartService['startAppointment']>
    ) {
        return this.startService.startAppointment(...args);
    }

    async completeAppointment(
        ...args: Parameters<AppointmentCompletionService['completeAppointment']>
    ) {
        return this.completionService.completeAppointment(...args);
    }
}