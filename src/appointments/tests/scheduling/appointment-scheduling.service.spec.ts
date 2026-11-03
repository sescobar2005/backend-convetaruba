import { describe, expect, it, vi } from 'vitest';

import { AppointmentReschedulingService } from '../../services/scheduling/appointment-rescheduling.service.js';
import { AppointmentSchedulingService } from '../../services/scheduling/appointment-scheduling.service.js';
import { AppointmentVeterinarianService } from '../../services/scheduling/appointment-veterinarian.service.js';
import { AppointmentCreationService } from '../../services/scheduling/appointment-creation.service.js';

describe('AppointmentSchedulingService', () => {
    const creationServiceMock = {
        createAppointment: vi.fn(),
    };

    const reschedulingServiceMock = {
        rescheduleAppointment: vi.fn(),
    };

    const veterinarianServiceMock = {
        changeVeterinarian: vi.fn(),
    };

    let service: AppointmentSchedulingService;

    beforeEach(() => {
        vi.clearAllMocks();

        service = new AppointmentSchedulingService(
            creationServiceMock as unknown as AppointmentCreationService,
            reschedulingServiceMock as unknown as AppointmentReschedulingService,
            veterinarianServiceMock as unknown as AppointmentVeterinarianService,
        );
    });

    describe('createAppointment', () => {
        it('should delegate appointment creation to AppointmentCreationService', async () => {
            const customerId = 'customer-id';
            const createdByUserId = 'user-id';
            const dto = { branchId: 'branch-id' } as never;
            const expectedResult = { idAppointment: 'appointment-id' };

            creationServiceMock.createAppointment.mockResolvedValue(
                expectedResult,
            );

            const result = await service.createAppointment(
                customerId,
                createdByUserId,
                dto,
            );

            expect(
                creationServiceMock.createAppointment,
            ).toHaveBeenCalledWith(
                customerId,
                createdByUserId,
                dto,
            );

            expect(result).toBe(expectedResult);
        });
    });

    describe('rescheduleAppointment', () => {
        it('should delegate appointment rescheduling to AppointmentReschedulingService', async () => {
            const appointmentId = 'appointment-id';
            const requestingUserId = 'user-id';
            const isStaff = true;
            const dto = { startsAt: '2035-05-14T14:00:00Z' } as never;
            const expectedResult = { idAppointment: appointmentId };

            reschedulingServiceMock.rescheduleAppointment.mockResolvedValue(
                expectedResult,
            );

            const result = await service.rescheduleAppointment(
                appointmentId,
                requestingUserId,
                isStaff,
                dto,
            );

            expect(
                reschedulingServiceMock.rescheduleAppointment,
            ).toHaveBeenCalledWith(
                appointmentId,
                requestingUserId,
                isStaff,
                dto,
            );

            expect(result).toBe(expectedResult);
        });
    });

    describe('changeVeterinarian', () => {
        it('should delegate veterinarian changes to AppointmentVeterinarianService', async () => {
            const appointmentId = 'appointment-id';
            const changedByUserId = 'user-id';
            const dto = { veterinarianId: 'veterinarian-id' } as never;
            const expectedResult = { idAppointment: appointmentId };

            veterinarianServiceMock.changeVeterinarian.mockResolvedValue(
                expectedResult,
            );

            const result = await service.changeVeterinarian(
                appointmentId,
                changedByUserId,
                dto,
            );

            expect(
                veterinarianServiceMock.changeVeterinarian,
            ).toHaveBeenCalledWith(
                appointmentId,
                changedByUserId,
                dto,
            );

            expect(result).toBe(expectedResult);
        });
    });
});