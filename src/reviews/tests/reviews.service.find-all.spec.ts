import { beforeEach, describe, expect, it } from 'vitest';

import { ReviewStatus } from '../../../generated/prisma/enums.js';

import { ReviewQueryDto } from '../dto/review-query.dto.js';
import { createReviewsServiceTestContext } from './reviews.service.test-utils.js';

describe('ReviewsService - getReviews', () => {
    let service: ReturnType<typeof createReviewsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createReviewsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createReviewsServiceTestContext());
    });

    const reviewId = 'c5f8a312-7d46-4e91-8b25-6a3f9d0c2e71';
    const appointmentId = 'a4e7c921-6b35-4d82-9f10-3c8a5e2b7d64';
    const customerId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const petId = 'd6a9b423-8f57-4c02-9d36-7b4e1a5f3c82';
    const branchId = 'e7b0c534-9a68-4d13-8e47-2c5f6a1b3d90';
    const serviceId = 'f8c1d645-0b79-4e24-9f58-3d6a7b2c4e01';

    const expectedReviews = [
        {
            idReview: reviewId,
            rating: 5,
            comment: 'Excelente atención veterinaria.',
            status: ReviewStatus.PENDING,
            createdAt: new Date('2026-10-28T14:30:00.000Z'),
            updatedAt: new Date('2026-10-28T15:00:00.000Z'),
            appointment: {
                idAppointment: appointmentId,
                startsAt: new Date('2026-10-27T14:00:00.000Z'),
                completedAt: new Date('2026-10-27T14:45:00.000Z'),
                customer: {
                    idUser: customerId,
                    firstName: 'Carlos',
                    lastName: 'Ramírez',
                    email: 'carlos.ramirez@example.com',
                },
                pet: {
                    idPet: petId,
                    name: 'Max',
                    species: 'DOG',
                },
                branch: {
                    idBranch: branchId,
                    name: 'Convetaruba Principal',
                    city: 'Medellín',
                },
                branchService: {
                    service: {
                        idService: serviceId,
                        name: 'Consulta veterinaria general',
                    },
                },
            },
        },
    ];

    it('should return all reviews with pagination metadata', async () => {
        prismaMock.client.$transaction.mockResolvedValue([
            expectedReviews,
            1,
        ]);

        const query: ReviewQueryDto = {
            page: 1,
            limit: 10,
        };

        const result = await service.getReviews(query);

        expect(result).toEqual({
            data: expectedReviews,
            meta: {
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            },
        });

        expect(prismaMock.client.review.findMany).toHaveBeenCalledWith({
            where: {},
            select: {
                idReview: true,
                rating: true,
                comment: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                appointment: {
                    select: {
                        idAppointment: true,
                        startsAt: true,
                        completedAt: true,
                        customer: {
                            select: {
                                idUser: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        pet: {
                            select: {
                                idPet: true,
                                name: true,
                                species: true,
                            },
                        },
                        branch: {
                            select: {
                                idBranch: true,
                                name: true,
                                city: true,
                            },
                        },
                        branchService: {
                            select: {
                                service: {
                                    select: {
                                        idService: true,
                                        name: true,
                                    },
                                },
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

        expect(prismaMock.client.review.count).toHaveBeenCalledWith({
            where: {},
        });
    });

    it('should filter reviews by status', async () => {
        prismaMock.client.$transaction.mockResolvedValue([
            expectedReviews,
            1,
        ]);

        const query: ReviewQueryDto = {
            page: 1,
            limit: 10,
            status: ReviewStatus.PENDING,
        };

        await service.getReviews(query);

        expect(prismaMock.client.review.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    status: ReviewStatus.PENDING,
                },
            }),
        );

        expect(prismaMock.client.review.count).toHaveBeenCalledWith({
            where: {
                status: ReviewStatus.PENDING,
            },
        });
    });

    it('should apply the correct pagination offset and limit', async () => {
        prismaMock.client.$transaction.mockResolvedValue([
            expectedReviews,
            25,
        ]);

        const query: ReviewQueryDto = {
            page: 3,
            limit: 5,
        };

        const result = await service.getReviews(query);

        expect(prismaMock.client.review.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 10,
                take: 5,
            }),
        );

        expect(result.meta).toEqual({
            total: 25,
            page: 3,
            limit: 5,
            totalPages: 5,
        });
    });

    it('should return an empty list when no reviews match the query', async () => {
        prismaMock.client.$transaction.mockResolvedValue([
            [],
            0,
        ]);

        const query: ReviewQueryDto = {
            page: 1,
            limit: 10,
            status: ReviewStatus.HIDDEN,
        };

        const result = await service.getReviews(query);

        expect(result).toEqual({
            data: [],
            meta: {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            },
        });

        expect(prismaMock.client.review.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    status: ReviewStatus.HIDDEN,
                },
            }),
        );

        expect(prismaMock.client.review.findMany).toHaveBeenCalledTimes(1);
        expect(prismaMock.client.review.count).toHaveBeenCalledTimes(1);
    });

    it('should propagate database errors when the transaction fails', async () => {
        const databaseError = new Error(
            'Database connection failed',
        );

        prismaMock.client.$transaction.mockRejectedValue(databaseError);

        const query: ReviewQueryDto = {
            page: 1,
            limit: 10,
        };

        await expect(
            service.getReviews(query),
        ).rejects.toBe(databaseError);
    });
});