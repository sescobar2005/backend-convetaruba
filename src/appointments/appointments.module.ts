import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AppointmentsController } from './appointments.controller.js';

import { AppointmentsService } from './services/appointments.service.js';
import { AppointmentAvailabilityService } from './services/appointment-availability.service.js';
import { AppointmentHistoryService } from './services/appointment-history.service.js';
import { AppointmentExpirationService } from './services/appointment-expiration.service.js';
import { AppointmentQueryService } from './services/appointment-query.service.js';

import { AppointmentLifecycleService } from './services/lifecycle/appointment-lifecycle.service.js';
import { AppointmentConfirmationService } from './services/lifecycle/appointment-confirmation.service.js';
import { AppointmentRejectionService } from './services/lifecycle/appointment-rejection.service.js';
import { AppointmentCancellationService } from './services/lifecycle/appointment-cancellation.service.js';
import { AppointmentStartService } from './services/lifecycle/appointment-start.service.js';
import { AppointmentCompletionService } from './services/lifecycle/appointment-completion.service.js';

import { AppointmentSchedulingService } from './services/scheduling/appointment-scheduling.service.js';
import { AppointmentCreationService } from './services/scheduling/appointment-creation.service.js';
import { AppointmentReschedulingService } from './services/scheduling/appointment-rescheduling.service.js';
import { AppointmentVeterinarianService } from './services/scheduling/appointment-veterinarian.service.js';

@Module({
    imports: [PrismaModule],
    controllers: [AppointmentsController],
    providers: [
        AppointmentsService,
        AppointmentAvailabilityService,
        AppointmentHistoryService,
        AppointmentExpirationService,
        AppointmentQueryService,

        AppointmentLifecycleService,
        AppointmentConfirmationService,
        AppointmentRejectionService,
        AppointmentCancellationService,
        AppointmentStartService,
        AppointmentCompletionService,

        AppointmentSchedulingService,
        AppointmentCreationService,
        AppointmentReschedulingService,
        AppointmentVeterinarianService,
    ],
    exports: [AppointmentsService],
})
export class AppointmentsModule {}