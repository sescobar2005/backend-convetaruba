import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';

import { MedicalRecordsController } from './medical-records.controller.js';
import { MedicalRecordsService } from './medical-records.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

describe('MedicalRecordsController', () => {
    let controller: MedicalRecordsController;

    const medicalRecordsServiceMock = {
        findById: vi.fn(),
        findByPetId: vi.fn(),
        update: vi.fn(),
    };

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const customerId = '8c9f4d3b-1a52-4e76-9b23-4f7a6d1c0b85';
    const medicalRecordId = '1f2c7a6e-4d85-419a-8e56-7c0d9a4f3eb8';
    const petId = '2a3d8b7f-5e96-42ab-9f67-8d1e0b5a4fc9';

    const customerRequest = {
        user: {
            sub: customerId,
            role: 'CUSTOMER' as const,
            tokenVersion: 0,
        },
    };

    const staffRequest = {
        user: {
            sub: userId,
            role: 'STAFF' as const,
            tokenVersion: 0,
        },
    };

    const adminRequest = {
        user: {
            sub: userId,
            role: 'ADMIN' as const,
            tokenVersion: 0,
        },
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [MedicalRecordsController],
            providers: [
                {
                    provide: MedicalRecordsService,
                    useValue: medicalRecordsServiceMock,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: vi.fn(() => true),
            })
            .compile();

        controller = module.get<MedicalRecordsController>(
            MedicalRecordsController,
        );
    });

    describe('findById', () => {
        it('should return a medical record', async () => {
            const expectedResult = {
                idMedicalRecord: medicalRecordId,
                petId,
                veterinarianId: userId,
                diagnosis: 'Mild dermatitis.',
            };

            medicalRecordsServiceMock.findById.mockResolvedValue(expectedResult);

            await expect(
                controller.findById(
                    medicalRecordId,
                    adminRequest as never,
                ),
            ).resolves.toEqual(expectedResult);

            expect(medicalRecordsServiceMock.findById).toHaveBeenCalledWith(
                medicalRecordId,
                userId,
                'ADMIN',
            );

            expect(medicalRecordsServiceMock.findById).toHaveBeenCalledTimes(1);
        });

        it('should pass the authenticated customer identity to the service', async () => {
            const expectedResult = {
                idMedicalRecord: medicalRecordId,
                petId,
                diagnosis: 'Mild dermatitis.',
            };

            medicalRecordsServiceMock.findById.mockResolvedValue(expectedResult);

            await expect(
                controller.findById(
                    medicalRecordId,
                    customerRequest as never,
                ),
            ).resolves.toEqual(expectedResult);

            expect(medicalRecordsServiceMock.findById).toHaveBeenCalledWith(
                medicalRecordId,
                customerId,
                'CUSTOMER',
            );
        });

        it('should pass the authenticated staff identity to the service', async () => {
            medicalRecordsServiceMock.findById.mockResolvedValue({
                idMedicalRecord: medicalRecordId,
            });

            await expect(
                controller.findById(
                    medicalRecordId,
                    staffRequest as never,
                ),
            ).resolves.toEqual({
                idMedicalRecord: medicalRecordId,
            });

            expect(medicalRecordsServiceMock.findById).toHaveBeenCalledWith(
                medicalRecordId,
                userId,
                'STAFF',
            );
        });

        it('should propagate service errors', async () => {
            medicalRecordsServiceMock.findById.mockRejectedValue(
                new Error('Medical record lookup failed'),
            );

            await expect(
                controller.findById(
                    medicalRecordId,
                    adminRequest as never,
                ),
            ).rejects.toThrow('Medical record lookup failed');
        });
    });

    describe('findByPetId', () => {
        it('should return paginated medical records for a pet', async () => {
            const filters = {
                page: 1,
                limit: 10,
            };

            const expectedResult = {
                data: [
                    {
                        idMedicalRecord: medicalRecordId,
                        petId,
                        diagnosis: 'Mild dermatitis.',
                    },
                ],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
            };

            medicalRecordsServiceMock.findByPetId.mockResolvedValue(
                expectedResult,
            );

            await expect(
                controller.findByPetId(
                    petId,
                    filters,
                    customerRequest as never,
                ),
            ).resolves.toEqual(expectedResult);

            expect(medicalRecordsServiceMock.findByPetId).toHaveBeenCalledWith(
                petId,
                customerId,
                'CUSTOMER',
                filters,
            );

            expect(medicalRecordsServiceMock.findByPetId).toHaveBeenCalledTimes(1);
        });

        it('should pass the authenticated veterinarian identity to the service', async () => {
            const filters = {
                page: 2,
                limit: 20,
            };

            medicalRecordsServiceMock.findByPetId.mockResolvedValue({
                data: [],
                meta: {
                    total: 0,
                    page: 2,
                    limit: 20,
                    totalPages: 0,
                },
            });

            await expect(
                controller.findByPetId(
                    petId,
                    filters,
                    staffRequest as never,
                ),
            ).resolves.toEqual({
                data: [],
                meta: {
                    total: 0,
                    page: 2,
                    limit: 20,
                    totalPages: 0,
                },
            });

            expect(medicalRecordsServiceMock.findByPetId).toHaveBeenCalledWith(
                petId,
                userId,
                'STAFF',
                filters,
            );
        });

        it('should pass the authenticated admin identity to the service', async () => {
            const filters = {
                page: 1,
                limit: 10,
            };

            medicalRecordsServiceMock.findByPetId.mockResolvedValue({
                data: [],
                meta: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0,
                },
            });

            await controller.findByPetId(
                petId,
                filters,
                adminRequest as never,
            );

            expect(medicalRecordsServiceMock.findByPetId).toHaveBeenCalledWith(
                petId,
                userId,
                'ADMIN',
                filters,
            );
        });

        it('should propagate service errors', async () => {
            medicalRecordsServiceMock.findByPetId.mockRejectedValue(
                new Error('Medical history lookup failed'),
            );

            await expect(
                controller.findByPetId(
                    petId,
                    { page: 1, limit: 10 },
                    customerRequest as never,
                ),
            ).rejects.toThrow('Medical history lookup failed');
        });
    });

    describe('update', () => {
        it('should update a medical record', async () => {
            const dto = {
                observations: 'Patient is stable.',
                diagnosis: 'Mild dermatitis.',
                treatment: 'Topical treatment.',
                recommendations: 'Follow-up in seven days.',
            };

            const expectedResult = {
                idMedicalRecord: medicalRecordId,
                petId,
                observations: dto.observations,
                diagnosis: dto.diagnosis,
                treatment: dto.treatment,
                recommendations: dto.recommendations,
            };

            medicalRecordsServiceMock.update.mockResolvedValue(expectedResult);

            await expect(
                controller.update(
                    medicalRecordId,
                    dto,
                    adminRequest as never,
                ),
            ).resolves.toEqual(expectedResult);

            expect(medicalRecordsServiceMock.update).toHaveBeenCalledWith(
                medicalRecordId,
                userId,
                'ADMIN',
                dto,
            );

            expect(medicalRecordsServiceMock.update).toHaveBeenCalledTimes(1);
        });

        it('should pass the authenticated veterinarian identity to the service', async () => {
            const dto = {
                diagnosis: 'Updated diagnosis.',
            };

            medicalRecordsServiceMock.update.mockResolvedValue({
                idMedicalRecord: medicalRecordId,
                diagnosis: dto.diagnosis,
            });

            await expect(
                controller.update(
                    medicalRecordId,
                    dto,
                    staffRequest as never,
                ),
            ).resolves.toEqual({
                idMedicalRecord: medicalRecordId,
                diagnosis: dto.diagnosis,
            });

            expect(medicalRecordsServiceMock.update).toHaveBeenCalledWith(
                medicalRecordId,
                userId,
                'STAFF',
                dto,
            );
        });

        it('should pass the authenticated customer identity to the service', async () => {
            const dto = {
                diagnosis: 'Unauthorized diagnosis.',
            };

            medicalRecordsServiceMock.update.mockRejectedValue(
                new Error('You are not authorized to access this medical record'),
            );

            await expect(
                controller.update(
                    medicalRecordId,
                    dto,
                    customerRequest as never,
                ),
            ).rejects.toThrow(
                'You are not authorized to access this medical record',
            );

            expect(medicalRecordsServiceMock.update).toHaveBeenCalledWith(
                medicalRecordId,
                customerId,
                'CUSTOMER',
                dto,
            );
        });

        it('should propagate service errors', async () => {
            medicalRecordsServiceMock.update.mockRejectedValue(
                new Error('Medical record update failed'),
            );

            await expect(
                controller.update(
                    medicalRecordId,
                    { diagnosis: 'Updated diagnosis.' },
                    adminRequest as never,
                ),
            ).rejects.toThrow('Medical record update failed');
        });
    });
});