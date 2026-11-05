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

describe('MedicalRecordsService - findByPetId', () => {
    let service: ReturnType<typeof createMedicalRecordsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createMedicalRecordsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createMedicalRecordsServiceTestContext());
    });

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const customerId = '8c9f4d3b-1a52-4e76-9b23-4f7a6d1c0b85';
    const veterinarianId = '9d0a5e4c-2b63-4f87-8c34-5a8b7e2d1c96';
    const otherVeterinarianId = '0e1b6f5d-3c74-4089-9d45-6b9c8f3e2da7';

    const petId = '2a3d8b7f-5e96-42ab-9f67-8d1e0b5a4fc9';
    const medicalRecordId = '1f2c7a6e-4d85-419a-8e56-7c0d9a4f3eb8';
    const appointmentId = '3b4e9c8a-6f07-43bc-a078-9e2f1c6b5ad0';

    const filters = {
        page: 1,
        limit: 10,
    };

    const pet = {
        idPet: petId,
        ownerId: customerId,
    };

    const medicalRecords = [
        {
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
        },
    ];

    const activeVeterinarian = {
        idStaff: veterinarianId,
        position: StaffPosition.VETERINARIAN,
        isActive: true,
    };

    it('should return paginated medical records when the requesting user is an admin', async () => {
        prismaMock.client.pet.findUnique.mockResolvedValue(pet);
        prismaMock.client.medicalRecord.findMany.mockResolvedValue(medicalRecords);
        prismaMock.client.medicalRecord.count.mockResolvedValue(1);

        const result = await service.findByPetId(
            petId,
            userId,
            Role.ADMIN,
            filters,
        );

        expect(result).toEqual({
            data: medicalRecords,
            meta: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            },
        });

        expect(prismaMock.client.pet.findUnique).toHaveBeenCalledWith({
            where: {
                idPet: petId,
            },
            select: {
                idPet: true,
                ownerId: true,
            },
        });

        expect(prismaMock.client.medicalRecord.findMany).toHaveBeenCalledWith({
            where: {
                petId,
            },
            include: {
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
            orderBy: {
                createdAt: 'desc',
            },
            skip: 0,
            take: 10,
        });

        expect(prismaMock.client.medicalRecord.count).toHaveBeenCalledWith({
            where: {
                petId,
            },
        });

        expect(prismaMock.client.staff.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.client.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should return medical records when the requesting customer owns the pet', async () => {
        prismaMock.client.pet.findUnique.mockResolvedValue(pet);
        prismaMock.client.medicalRecord.findMany.mockResolvedValue(medicalRecords);
        prismaMock.client.medicalRecord.count.mockResolvedValue(1);

        const result = await service.findByPetId(
            petId,
            customerId,
            Role.CUSTOMER,
            filters,
        );

        expect(result.data).toEqual(medicalRecords);

        expect(prismaMock.client.medicalRecord.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    petId,
                },
            }),
        );

        expect(prismaMock.client.staff.findUnique).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when the customer does not own the pet', async () => {
        prismaMock.client.pet.findUnique.mockResolvedValue(pet);

        await expect(
            service.findByPetId(
                petId,
                otherVeterinarianId,
                Role.CUSTOMER,
                filters,
            ),
        ).rejects.toThrow(ForbiddenException);

        expect(prismaMock.client.medicalRecord.findMany).not.toHaveBeenCalled();
        expect(prismaMock.client.medicalRecord.count).not.toHaveBeenCalled();
        expect(prismaMock.client.$transaction).not.toHaveBeenCalled();
    });

    it('should return only the requesting veterinarian medical records', async () => {
        prismaMock.client.pet.findUnique.mockResolvedValue(pet);
        prismaMock.client.staff.findUnique.mockResolvedValue(activeVeterinarian);
        prismaMock.client.medicalRecord.findMany.mockResolvedValue(medicalRecords);
        prismaMock.client.medicalRecord.count.mockResolvedValue(1);

        const result = await service.findByPetId(
            petId,
            userId,
            Role.STAFF,
            filters,
        );

        expect(result.data).toEqual(medicalRecords);

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

        expect(prismaMock.client.medicalRecord.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    petId,
                    veterinarianId,
                },
            }),
        );

        expect(prismaMock.client.medicalRecord.count).toHaveBeenCalledWith({
            where: {
                petId,
                veterinarianId,
            },
        });
    });

    it('should throw ForbiddenException when the staff member is not a veterinarian', async () => {
        prismaMock.client.pet.findUnique.mockResolvedValue(pet);

        prismaMock.client.staff.findUnique.mockResolvedValue({
            ...activeVeterinarian,
            position: StaffPosition.ASSISTANT,
        });

        await expect(
            service.findByPetId(
                petId,
                userId,
                Role.STAFF,
                filters,
            ),
        ).rejects.toThrow(ForbiddenException);

        expect(prismaMock.client.medicalRecord.findMany).not.toHaveBeenCalled();
        expect(prismaMock.client.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when the veterinarian is inactive', async () => {
        prismaMock.client.pet.findUnique.mockResolvedValue(pet);

        prismaMock.client.staff.findUnique.mockResolvedValue({
            ...activeVeterinarian,
            isActive: false,
        });

        await expect(
            service.findByPetId(
                petId,
                userId,
                Role.STAFF,
                filters,
            ),
        ).rejects.toThrow(ForbiddenException);

        expect(prismaMock.client.medicalRecord.findMany).not.toHaveBeenCalled();
        expect(prismaMock.client.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the pet does not exist', async () => {
        prismaMock.client.pet.findUnique.mockResolvedValue(null);

        await expect(
            service.findByPetId(
                petId,
                userId,
                Role.ADMIN,
                filters,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.medicalRecord.findMany).not.toHaveBeenCalled();
        expect(prismaMock.client.medicalRecord.count).not.toHaveBeenCalled();
        expect(prismaMock.client.$transaction).not.toHaveBeenCalled();
    });

    it('should calculate pagination correctly for subsequent pages', async () => {
        prismaMock.client.pet.findUnique.mockResolvedValue(pet);
        prismaMock.client.medicalRecord.findMany.mockResolvedValue(medicalRecords);
        prismaMock.client.medicalRecord.count.mockResolvedValue(25);

        const result = await service.findByPetId(
            petId,
            userId,
            Role.ADMIN,
            {
                page: 2,
                limit: 10,
            },
        );

        expect(result.meta).toEqual({
            total: 25,
            page: 2,
            limit: 10,
            totalPages: 3,
        });

        expect(prismaMock.client.medicalRecord.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 10,
                take: 10,
            }),
        );
    });

    it('should propagate a database error', async () => {
        const databaseError = new Error('Database unavailable');

        prismaMock.client.pet.findUnique.mockResolvedValue(pet);
        prismaMock.client.medicalRecord.findMany.mockRejectedValue(databaseError);
        prismaMock.client.medicalRecord.count.mockResolvedValue(1);

        await expect(
            service.findByPetId(
                petId,
                userId,
                Role.ADMIN,
                filters,
            ),
        ).rejects.toBe(databaseError);
    });
});