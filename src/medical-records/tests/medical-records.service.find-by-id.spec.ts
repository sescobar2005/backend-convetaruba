import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';
import {
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';

import {
    Role,
    StaffPosition,
} from '../../../generated/prisma/enums.js';

import {
    createMedicalRecordsServiceTestContext,
} from './medical-records.service.test-utils.js';

describe('MedicalRecordsService - findById', () => {
    let service: ReturnType<typeof createMedicalRecordsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createMedicalRecordsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createMedicalRecordsServiceTestContext());
    });

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const customerId = '8c9f4d3b-1a52-4e76-9b23-4f7a6d1c0b85';
    const veterinarianId = '9d0a5e4c-2b63-4f87-8c34-5a8b7e2d1c96';
    const otherVeterinarianId = '0e1b6f5d-3c74-4089-9d45-6b9c8f3e2da7';

    const medicalRecordId = '1f2c7a6e-4d85-419a-8e56-7c0d9a4f3eb8';
    const petId = '2a3d8b7f-5e96-42ab-9f67-8d1e0b5a4fc9';
    const appointmentId = '3b4e9c8a-6f07-43bc-a078-9e2f1c6b5ad0';
    const branchId = '4c5f0d9b-7a18-44cd-b189-0f3a2d7c6be1';

    const medicalRecord = {
        idMedicalRecord: medicalRecordId,
        appointmentId,
        petId,
        veterinarianId,
        observations: 'Patient is stable.',
        diagnosis: 'Mild dermatitis.',
        treatment: 'Topical treatment.',
        recommendations: 'Follow-up in seven days.',
        createdAt: new Date('2026-11-04T14:00:00.000Z'),
        updatedAt: new Date('2026-11-04T14:30:00.000Z'),
        pet: {
            idPet: petId,
            name: 'Max',
            ownerId: customerId,
        },
        veterinarian: {
            idStaff: veterinarianId,
            userId,
            user: {
                firstName: 'Carlos',
                lastName: 'Ramirez',
            },
        },
        appointment: {
            idAppointment: appointmentId,
            startsAt: new Date('2026-11-04T13:00:00.000Z'),
            completedAt: new Date('2026-11-04T14:00:00.000Z'),
            branch: {
                idBranch: branchId,
                name: 'Main Branch',
            },
            branchService: {
                service: {
                    idService: '5d6a1e0c-8b29-45de-a290-1a4b3e8d7cf2',
                    name: 'General consultation',
                },
            },
        },
    };

    const activeVeterinarian = {
        idStaff: veterinarianId,
        position: StaffPosition.VETERINARIAN,
        isActive: true,
    };

    it('should return a medical record when the requesting user is an admin', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);

        const result = await service.findById(
            medicalRecordId,
            userId,
            Role.ADMIN,
        );

        expect(result).toEqual(medicalRecord);

        expect(prismaMock.client.medicalRecord.findUnique).toHaveBeenCalledWith({
            where: {
                idMedicalRecord: medicalRecordId,
            },
            include: {
                pet: {
                    select: {
                        idPet: true,
                        name: true,
                        ownerId: true,
                    },
                },
                veterinarian: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                appointment: {
                    select: {
                        idAppointment: true,
                        startsAt: true,
                        completedAt: true,
                        branch: {
                            select: {
                                idBranch: true,
                                name: true,
                            },
                        },
                        branchService: {
                            include: {
                                service: true,
                            },
                        },
                    },
                },
            },
        });

        expect(prismaMock.client.staff.findUnique).not.toHaveBeenCalled();
    });

    it('should return a medical record when the requesting customer owns the pet', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);

        const result = await service.findById(
            medicalRecordId,
            customerId,
            Role.CUSTOMER,
        );

        expect(result).toEqual(medicalRecord);
        expect(prismaMock.client.staff.findUnique).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when the customer does not own the pet', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);

        await expect(
            service.findById(
                medicalRecordId,
                otherVeterinarianId,
                Role.CUSTOMER,
            ),
        ).rejects.toThrow(ForbiddenException);

        expect(prismaMock.client.staff.findUnique).not.toHaveBeenCalled();
    });

    it('should return a medical record when the requesting veterinarian owns the record', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);
        prismaMock.client.staff.findUnique.mockResolvedValue(activeVeterinarian);

        const result = await service.findById(
            medicalRecordId,
            userId,
            Role.STAFF,
        );

        expect(result).toEqual(medicalRecord);

        expect(prismaMock.client.staff.findUnique).toHaveBeenCalledWith({
            where: {
                userId,
            },
            select: {
                idStaff: true,
                position: true,
                isActive: true,
            },
        });
    });

    it('should throw ForbiddenException when the veterinarian does not own the record', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue({
            ...medicalRecord,
            veterinarianId: otherVeterinarianId,
        });

        prismaMock.client.staff.findUnique.mockResolvedValue(activeVeterinarian);

        await expect(
            service.findById(
                medicalRecordId,
                userId,
                Role.STAFF,
            ),
        ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when the staff member is not an active veterinarian', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);

        prismaMock.client.staff.findUnique.mockResolvedValue({
            ...activeVeterinarian,
            position: StaffPosition.ASSISTANT,
        });

        await expect(
            service.findById(
                medicalRecordId,
                userId,
                Role.STAFF,
            ),
        ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when the staff member is inactive', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);

        prismaMock.client.staff.findUnique.mockResolvedValue({
            ...activeVeterinarian,
            isActive: false,
        });

        await expect(
            service.findById(
                medicalRecordId,
                userId,
                Role.STAFF,
            ),
        ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when the medical record does not exist', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(null);

        await expect(
            service.findById(
                medicalRecordId,
                userId,
                Role.ADMIN,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.staff.findUnique).not.toHaveBeenCalled();
    });

    it('should propagate a database error', async () => {
        const databaseError = new Error('Database unavailable');

        prismaMock.client.medicalRecord.findUnique.mockRejectedValue(databaseError);

        await expect(
            service.findById(
                medicalRecordId,
                userId,
                Role.ADMIN,
            ),
        ).rejects.toBe(databaseError);
    });
});