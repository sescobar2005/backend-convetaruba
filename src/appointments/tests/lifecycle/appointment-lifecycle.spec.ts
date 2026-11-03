import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentLifecycleService } from '../../services/lifecycle/appointment-lifecycle.service.js';
import { AppointmentConfirmationService } from '../../services/lifecycle/appointment-confirmation.service.js';
import { AppointmentRejectionService } from '../../services/lifecycle/appointment-rejection.service.js';
import { AppointmentCancellationService } from '../../services/lifecycle/appointment-cancellation.service.js';
import { AppointmentStartService } from '../../services/lifecycle/appointment-start.service.js';
import { AppointmentCompletionService } from '../../services/lifecycle/appointment-completion.service.js';
import {
    createLifecycleTestContext,
    LIFECYCLE_TEST_IDS,
} from './lifecycle-test.utils.js';

describe('AppointmentLifecycleService', () => {
    let context: ReturnType<typeof createLifecycleTestContext>;
    let service: AppointmentLifecycleService;

    let confirmationService: {
        confirmAppointment: ReturnType<typeof vi.fn>;
    };

    let rejectionService: {
        rejectAppointment: ReturnType<typeof vi.fn>;
    };

    let cancellationService: {
        cancelAppointment: ReturnType<typeof vi.fn>;
    };

    let startService: {
        startAppointment: ReturnType<typeof vi.fn>;
    };

    let completionService: {
        completeAppointment: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        context = createLifecycleTestContext();

        confirmationService = {
            confirmAppointment: vi.fn().mockResolvedValue(
                context.confirmedAppointment,
            ),
        };

        rejectionService = {
            rejectAppointment: vi.fn().mockResolvedValue(
                context.rejectedAppointment,
            ),
        };

        cancellationService = {
            cancelAppointment: vi.fn().mockResolvedValue(
                context.cancelledAppointment,
            ),
        };

        startService = {
            startAppointment: vi.fn().mockResolvedValue(
                context.inProgressAppointment,
            ),
        };

        completionService = {
            completeAppointment: vi.fn().mockResolvedValue(
                context.completedAppointment,
            ),
        };

        service = new AppointmentLifecycleService(
            confirmationService as unknown as AppointmentConfirmationService,
            rejectionService as unknown as AppointmentRejectionService,
            cancellationService as unknown as AppointmentCancellationService,
            startService as unknown as AppointmentStartService,
            completionService as unknown as AppointmentCompletionService,
        );
    });

    it('should delegate appointment confirmation to AppointmentConfirmationService', async () => {
        const result = await service.confirmAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.confirmation,
        );

        expect(
            confirmationService.confirmAppointment,
        ).toHaveBeenCalledWith(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.confirmation,
        );

        expect(result).toEqual(context.confirmedAppointment);
    });

    it('should delegate appointment rejection to AppointmentRejectionService', async () => {
        const result = await service.rejectAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.rejection,
        );

        expect(
            rejectionService.rejectAppointment,
        ).toHaveBeenCalledWith(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.rejection,
        );

        expect(result).toEqual(context.rejectedAppointment);
    });

    it('should delegate appointment cancellation to AppointmentCancellationService', async () => {
        const result = await service.cancelAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.cancellation,
        );

        expect(
            cancellationService.cancelAppointment,
        ).toHaveBeenCalledWith(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.cancellation,
        );

        expect(result).toEqual(context.cancelledAppointment);
    });

    it('should delegate appointment start to AppointmentStartService', async () => {
        const result = await service.startAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
        );

        expect(
            startService.startAppointment,
        ).toHaveBeenCalledWith(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
        );

        expect(result).toEqual(context.inProgressAppointment);
    });

    it('should delegate appointment completion to AppointmentCompletionService', async () => {
        const result = await service.completeAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.veterinarianUser,
            context.dtos.completion,
        );

        expect(
            completionService.completeAppointment,
        ).toHaveBeenCalledWith(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.veterinarianUser,
            context.dtos.completion,
        );

        expect(result).toEqual(context.completedAppointment);
    });
});