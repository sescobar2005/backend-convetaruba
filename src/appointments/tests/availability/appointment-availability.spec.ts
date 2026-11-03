import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { AppointmentAvailabilityService } from '../../services/appointment-availability.service.js';
import {
    AVAILABILITY_TEST_DATE,
    AVAILABILITY_TEST_FIXTURES,
    AVAILABILITY_TEST_IDS,
    createAvailabilityTestContext,
} from './availability-test.utils.js';

describe('AppointmentAvailabilityService', () => {
    let context: ReturnType<typeof createAvailabilityTestContext>;
    let service: AppointmentAvailabilityService;

    const query = {
        branchId: AVAILABILITY_TEST_IDS.branch,
        veterinarianId: AVAILABILITY_TEST_IDS.veterinarian,
        date: AVAILABILITY_TEST_DATE,
    };

    const now = new Date('2030-05-06T10:00:00.000Z');

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(now);

        context = createAvailabilityTestContext();

        service = new AppointmentAvailabilityService(
            context.prismaMock,
            context.expirationServiceMock as never,
        );

        context.transactionMock.branch.findUnique.mockResolvedValue(
            AVAILABILITY_TEST_FIXTURES.branch,
        );

        context.transactionMock.staff.findUnique.mockResolvedValue(
            AVAILABILITY_TEST_FIXTURES.veterinarian,
        );

        context.transactionMock.staffBranch.findFirst.mockResolvedValue(
            AVAILABILITY_TEST_FIXTURES.assignment,
        );

        context.transactionMock.staffSchedule.findMany.mockResolvedValue(
            AVAILABILITY_TEST_FIXTURES.schedules,
        );

        context.transactionMock.appointment.findMany.mockResolvedValue([]);
        context.transactionMock.appointmentBlock.findMany.mockResolvedValue(
            [],
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return available appointment slots', async () => {
        const result = await service.getAvailability(query);

        expect(result).toEqual({
            ...query,
            timeZone: 'America/Aruba',
            availableSlots: expect.any(Array),
        });

        expect(result.availableSlots.length).toBeGreaterThan(0);
    });

    it('should return slots using the branch timezone', async () => {
        const result = await service.getAvailability(query);

        expect(result.timeZone).toBe('America/Aruba');
        expect(result.availableSlots[0].localTime).toBe('08:00');
        expect(result.availableSlots[0].startsAt).toBe(
            '2030-05-06T12:00:00.000Z',
        );
    });

    it('should exclude slots that have already started', async () => {
        const result = await service.getAvailability(query);

        expect(
            result.availableSlots.every(
                (slot) => new Date(slot.startsAt) > now,
            ),
        ).toBe(true);
    });

    it('should throw when the date is invalid', async () => {
        await expect(
            service.getAvailability({
                ...query,
                date: 'invalid-date',
            }),
        ).rejects.toThrow(BadRequestException);
    });

    it('should throw when the branch does not exist', async () => {
        context.transactionMock.branch.findUnique.mockResolvedValue(null);

        await expect(service.getAvailability(query)).rejects.toThrow(
            new NotFoundException('Active branch not found'),
        );
    });

    it('should throw when the branch is inactive', async () => {
        context.transactionMock.branch.findUnique.mockResolvedValue({
            ...AVAILABILITY_TEST_FIXTURES.branch,
            isActive: false,
        });

        await expect(service.getAvailability(query)).rejects.toThrow(
            new NotFoundException('Active branch not found'),
        );
    });

    it('should throw when the veterinarian does not exist', async () => {
        context.transactionMock.staff.findUnique.mockResolvedValue(null);

        await expect(service.getAvailability(query)).rejects.toThrow(
            new NotFoundException('Active veterinarian not found'),
        );
    });

    it('should throw when the veterinarian is inactive', async () => {
        context.transactionMock.staff.findUnique.mockResolvedValue({
            ...AVAILABILITY_TEST_FIXTURES.veterinarian,
            isActive: false,
        });

        await expect(service.getAvailability(query)).rejects.toThrow(
            new NotFoundException('Active veterinarian not found'),
        );
    });

    it('should throw when the staff member is not a veterinarian', async () => {
        context.transactionMock.staff.findUnique.mockResolvedValue({
            ...AVAILABILITY_TEST_FIXTURES.veterinarian,
            position: 'ASSISTANT',
        });

        await expect(service.getAvailability(query)).rejects.toThrow(
            new NotFoundException('Active veterinarian not found'),
        );
    });

    it('should throw when the veterinarian is not assigned to the branch', async () => {
        context.transactionMock.staffBranch.findFirst.mockResolvedValue(null);

        await expect(service.getAvailability(query)).rejects.toThrow(
            new NotFoundException(
                'Veterinarian is not assigned to this branch on the requested date',
            ),
        );
    });

    it('should return no slots when the veterinarian has no schedules', async () => {
        context.transactionMock.staffSchedule.findMany.mockResolvedValue([]);

        const result = await service.getAvailability(query);

        expect(result.availableSlots).toEqual([]);
        expect(context.transactionMock.appointment.findMany).not.toHaveBeenCalled();
        expect(context.transactionMock.appointmentBlock.findMany).not.toHaveBeenCalled();
    });

    it('should expire pending appointments before checking availability', async () => {
        await service.getAvailability(query);

        expect(
            context.expirationServiceMock.expirePendingAppointments,
        ).toHaveBeenCalledWith(
            context.transactionMock,
            AVAILABILITY_TEST_IDS.veterinarian,
            now,
        );
    });
});