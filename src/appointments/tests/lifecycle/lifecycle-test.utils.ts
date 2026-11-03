import { vi } from 'vitest';
import {
    AppointmentHistoryAction,
    AppointmentStatus,
    StaffPosition,
} from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

export const LIFECYCLE_TEST_IDS = {
    appointment: 'appointment-test-id',
    veterinarian: 'veterinarian-test-id',
    veterinarianUser: 'veterinarian-user-test-id',
    branch: 'branch-test-id',
    staff: 'staff-test-id',
    pet: 'pet-test-id',
    customer: 'customer-test-id',
    branchService: 'branch-service-test-id',
    staffBranch: 'staff-branch-test-id',
    medicalRecord: 'medical-record-test-id',
};

export const LIFECYCLE_TEST_DATES = {
    now: new Date('2035-05-14T12:00:00.000Z'),
    startsAt: new Date('2035-05-14T14:00:00.000Z'),
    endsAt: new Date('2035-05-14T15:00:00.000Z'),
    confirmationExpiresAt: new Date('2035-05-14T13:00:00.000Z'),
};

export const LIFECYCLE_TEST_REASONS = {
    rejection: 'Veterinarian unavailable',
    cancellation: 'Customer requested cancellation',
    expiration:
        'Appointment request expired after 15 minutes without confirmation',
    completion: 'Appointment completed and medical record created',
};

export function createLifecycleAppointmentFixture(overrides = {}) {
    const appointment = {
        idAppointment: LIFECYCLE_TEST_IDS.appointment,
        veterinarianId: LIFECYCLE_TEST_IDS.veterinarian,
        branchId: LIFECYCLE_TEST_IDS.branch,
        petId: LIFECYCLE_TEST_IDS.pet,
        customerId: LIFECYCLE_TEST_IDS.customer,
        branchServiceId: LIFECYCLE_TEST_IDS.branchService,
        startsAt: LIFECYCLE_TEST_DATES.startsAt,
        endsAt: null,
        confirmationExpiresAt:
            LIFECYCLE_TEST_DATES.confirmationExpiresAt,
        status: AppointmentStatus.PENDING,
        cancelledAt: null,
        cancellationReason: null,
        completedAt: null,
        branch: {
            idBranch: LIFECYCLE_TEST_IDS.branch,
            timeZone: 'America/Aruba',
            isActive: true,
        },
        veterinarian: {
            idStaff: LIFECYCLE_TEST_IDS.veterinarian,
            userId: LIFECYCLE_TEST_IDS.veterinarianUser,
            isActive: true,
            position: StaffPosition.VETERINARIAN,
        },
        pet: {
            idPet: LIFECYCLE_TEST_IDS.pet,
        },
        customer: {
            idUser: LIFECYCLE_TEST_IDS.customer,
            firstName: 'Test',
            lastName: 'Customer',
        },
        branchService: {
            idBranchService: LIFECYCLE_TEST_IDS.branchService,
        },
        medicalRecord: null,
        history: [],
    };

    return {
        ...appointment,
        ...overrides,
    };
}

export function createLifecycleTestContext() {
    const appointment = createLifecycleAppointmentFixture();

    const confirmedAppointment = {
        ...appointment,
        endsAt: LIFECYCLE_TEST_DATES.endsAt,
        status: AppointmentStatus.CONFIRMED,
    };

    const rejectedAppointment = {
        ...appointment,
        status: AppointmentStatus.REJECTED,
    };

    const cancelledAppointment = {
        ...confirmedAppointment,
        status: AppointmentStatus.CANCELLED,
        cancelledAt: LIFECYCLE_TEST_DATES.now,
        cancellationReason: LIFECYCLE_TEST_REASONS.cancellation,
    };

    const expiredAppointment = {
        ...appointment,
        status: AppointmentStatus.EXPIRED,
    };

    const inProgressAppointment = {
        ...confirmedAppointment,
        status: AppointmentStatus.IN_PROGRESS,
    };

    const medicalRecord = {
        idMedicalRecord: LIFECYCLE_TEST_IDS.medicalRecord,
        appointmentId: LIFECYCLE_TEST_IDS.appointment,
        petId: LIFECYCLE_TEST_IDS.pet,
        veterinarianId: LIFECYCLE_TEST_IDS.veterinarian,
        observations: 'Patient examined',
        diagnosis: 'Healthy',
        treatment: 'Routine care',
        recommendations: 'Regular checkups',
    };

    const completedAppointment = {
        ...inProgressAppointment,
        status: AppointmentStatus.COMPLETED,
        completedAt: LIFECYCLE_TEST_DATES.now,
        medicalRecord,
    };

    const transactionMock = {
        appointment: {
            findUnique: vi.fn().mockResolvedValue(appointment),
            findFirst: vi.fn().mockResolvedValue(null),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        appointmentHistory: {
            create: vi.fn().mockResolvedValue({}),
        },
        appointmentBlock: {
            findFirst: vi.fn().mockResolvedValue(null),
        },
        staffBranch: {
            findFirst: vi.fn().mockResolvedValue({
                idStaffBranch: LIFECYCLE_TEST_IDS.staffBranch,
            }),
        },
        staffSchedule: {
            findMany: vi.fn().mockResolvedValue([
                {
                    startsAt: '09:00',
                    endsAt: '17:00',
                },
            ]),
        },
        medicalRecord: {
            create: vi.fn().mockResolvedValue(medicalRecord),
        },
    };

    const prismaMock = {
        client: {
            $transaction: vi.fn(
                async (callback: (transaction: any) => unknown) =>
                    callback(transactionMock),
            ),
        },
    };

    return {
        appointment,
        confirmedAppointment,
        rejectedAppointment,
        cancelledAppointment,
        expiredAppointment,
        inProgressAppointment,
        completedAppointment,
        medicalRecord,
        transactionMock,
        prismaMock,
        prismaServiceMock: prismaMock as unknown as PrismaService,

        dtos: {
            confirmation: {
                endsAt: LIFECYCLE_TEST_DATES.endsAt.toISOString(),
            },
            rejection: {
                reason: `  ${LIFECYCLE_TEST_REASONS.rejection}  `,
            },
            cancellation: {
                reason: `  ${LIFECYCLE_TEST_REASONS.cancellation}  `,
            },
            completion: {
                observations: '  Patient examined  ',
                diagnosis: '  Healthy  ',
                treatment: '  Routine care  ',
                recommendations: '  Regular checkups  ',
            },
        },
    };
}