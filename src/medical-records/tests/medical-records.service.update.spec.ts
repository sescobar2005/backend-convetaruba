import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';
import {
    BadRequestException,
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

describe('MedicalRecordsService - update', () => {
    let service: ReturnType<typeof createMedicalRecordsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createMedicalRecordsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createMedicalRecordsServiceTestContext());
    });

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const customerId = '8c9f4d3b-1a52-4e76-9b23-4f7a6d1c0b85';
    const otherVeterinarianId = '0e1b6f5d-3c74-4089-9d45-6b9c8f3e2da7';

    const medicalRecordId = '1f2c7a6e-4d85-419a-8e56-7c0d9a4f3eb8';
    const petId = '2a3d8b7f-5e96-42ab-9f67-8d1e0b5a4fc9';
    const veterinarianId = '9d0a5e4c-2b63-4f87-8c34-5a8b7e2d1c96';

    const medicalRecord = {
        idMedicalRecord: medicalRecordId,
        veterinarianId,
        pet: {
            ownerId: customerId,
        },
    };

    const activeVeterinarian = {
        idStaff: veterinarianId,
        position: StaffPosition.VETERINARIAN,
        isActive: true,
    };

    const updateDto = {
        observations: '  Patient is stable.  ',
        diagnosis: '  Mild dermatitis.  ',
        treatment: '  Topical treatment.  ',
        recommendations: '  Follow-up in seven days.  ',
    };

    const updatedMedicalRecord = {
        idMedicalRecord: medicalRecordId,
        petId,
        veterinarianId,
        observations: 'Patient is stable.',
        diagnosis: 'Mild dermatitis.',
        treatment: 'Topical treatment.',
        recommendations: 'Follow-up in seven days.',
        createdAt: new Date('2026-11-04T14:00:00.000Z'),
        updatedAt: new Date('2026-11-05T15:00:00.000Z'),
        pet: {
            idPet: petId,
            name: 'Max',
        },
        veterinarian: {
            idStaff: veterinarianId,
            user: {
                firstName: 'Carlos',
                lastName: 'Ramirez',
            },
        },
    };

    it('should update a medical record when the requesting user is an admin', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);
        prismaMock.client.medicalRecord.update.mockResolvedValue(updatedMedicalRecord);

        const result = await service.update(
            medicalRecordId,
            userId,
            Role.ADMIN,
            updateDto,
        );

        expect(result).toEqual(updatedMedicalRecord);

        expect(prismaMock.client.medicalRecord.findUnique).toHaveBeenCalledWith({
            where: {
                idMedicalRecord: medicalRecordId,
            },
            select: {
                idMedicalRecord: true,
                veterinarianId: true,
                pet: {
                    select: {
                        ownerId: true,
                    },
                },
            },
        });

        expect(prismaMock.client.medicalRecord.update).toHaveBeenCalledWith({
            where: {
                idMedicalRecord: medicalRecordId,
            },
            data: {
                observations: 'Patient is stable.',
                diagnosis: 'Mild dermatitis.',
                treatment: 'Topical treatment.',
                recommendations: 'Follow-up in seven days.',
            },
            include: {
                pet: {
                    select: {
                        idPet: true,
                        name: true,
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
            },
        });

        expect(prismaMock.client.staff.findUnique).not.toHaveBeenCalled();
    });

    it('should update a medical record when the requesting veterinarian owns the record', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);
        prismaMock.client.staff.findUnique.mockResolvedValue(activeVeterinarian);
        prismaMock.client.medicalRecord.update.mockResolvedValue(updatedMedicalRecord);

        const result = await service.update(
            medicalRecordId,
            userId,
            Role.STAFF,
            updateDto,
        );

        expect(result).toEqual(updatedMedicalRecord);

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

        expect(prismaMock.client.medicalRecord.update).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException when the veterinarian does not own the record', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue({
            ...medicalRecord,
            veterinarianId: otherVeterinarianId,
        });

        prismaMock.client.staff.findUnique.mockResolvedValue(activeVeterinarian);

        await expect(
            service.update(
                medicalRecordId,
                userId,
                Role.STAFF,
                updateDto,
            ),
        ).rejects.toThrow(ForbiddenException);

        expect(prismaMock.client.medicalRecord.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when the staff member is not an active veterinarian', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);

        prismaMock.client.staff.findUnique.mockResolvedValue({
            ...activeVeterinarian,
            position: StaffPosition.ASSISTANT,
        });

        await expect(
            service.update(
                medicalRecordId,
                userId,
                Role.STAFF,
                updateDto,
            ),
        ).rejects.toThrow(ForbiddenException);

        expect(prismaMock.client.medicalRecord.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when the veterinarian is inactive', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);

        prismaMock.client.staff.findUnique.mockResolvedValue({
            ...activeVeterinarian,
            isActive: false,
        });

        await expect(
            service.update(
                medicalRecordId,
                userId,
                Role.STAFF,
                updateDto,
            ),
        ).rejects.toThrow(ForbiddenException);

        expect(prismaMock.client.medicalRecord.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when the requesting user is a customer', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);

        await expect(
            service.update(
                medicalRecordId,
                customerId,
                Role.CUSTOMER,
                updateDto,
            ),
        ).rejects.toThrow(ForbiddenException);

        expect(prismaMock.client.staff.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.client.medicalRecord.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the medical record does not exist', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(null);

        await expect(
            service.update(
                medicalRecordId,
                userId,
                Role.ADMIN,
                updateDto,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.medicalRecord.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no fields are provided', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);

        await expect(
            service.update(
                medicalRecordId,
                userId,
                Role.ADMIN,
                {},
            ),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.medicalRecord.update).not.toHaveBeenCalled();
    });

    it('should update only the provided fields', async () => {
        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);
        prismaMock.client.medicalRecord.update.mockResolvedValue(updatedMedicalRecord);

        await service.update(
            medicalRecordId,
            userId,
            Role.ADMIN,
            {
                diagnosis: '  Mild dermatitis.  ',
            },
        );

        expect(prismaMock.client.medicalRecord.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    idMedicalRecord: medicalRecordId,
                },
                data: {
                    diagnosis: 'Mild dermatitis.',
                },
            }),
        );
    });

    it('should propagate a database error when updating a medical record', async () => {
        const databaseError = new Error('Database unavailable');

        prismaMock.client.medicalRecord.findUnique.mockResolvedValue(medicalRecord);
        prismaMock.client.medicalRecord.update.mockRejectedValue(databaseError);

        await expect(
            service.update(
                medicalRecordId,
                userId,
                Role.ADMIN,
                updateDto,
            ),
        ).rejects.toBe(databaseError);
    });
});