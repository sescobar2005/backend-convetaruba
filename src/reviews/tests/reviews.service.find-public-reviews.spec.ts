import { beforeEach, describe, expect, it } from 'vitest';

import { ReviewStatus } from '../../../generated/prisma/enums.js';

import { createReviewsServiceTestContext } from './reviews.service.test-utils.js';

describe('ReviewsService - getPublicReviews', () => {
    let service: ReturnType<typeof createReviewsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createReviewsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createReviewsServiceTestContext());
    });

    const reviewId = 'c5f8a312-7d46-4e91-8b25-6a3f9d0c2e71';

    const expectedReviews = [
        {
            idReview: reviewId,
            rating: 5,
            comment: 'Excelente atención veterinaria.',
            createdAt: new Date('2026-10-28T14:30:00.000Z'),
            appointment: {
                pet: {
                    name: 'Max',
                    species: 'DOG',
                },
                branch: {
                    name: 'Convetaruba Principal',
                    city: 'Medellín',
                },
                branchService: {
                    service: {
                        name: 'Consulta veterinaria general',
                    },
                },
                customer: {
                    firstName: 'Carlos',
                },
            },
        },
    ];

    it('should return only approved reviews with public information', async () => {
        prismaMock.client.$transaction.mockResolvedValue([
            expectedReviews,
            1,
        ]);

        const result = await service.getPublicReviews();

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
            where: {
                status: ReviewStatus.APPROVED,
            },
            select: {
                idReview: true,
                rating: true,
                comment: true,
                createdAt: true,
                appointment: {
                    select: {
                        pet: {
                            select: {
                                name: true,
                                species: true,
                            },
                        },
                        branch: {
                            select: {
                                name: true,
                                city: true,
                            },
                        },
                        branchService: {
                            select: {
                                service: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                        customer: {
                            select: {
                                firstName: true,
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
            where: {
                status: ReviewStatus.APPROVED,
            },
        });
    });

    it('should apply the correct pagination offset and limit', async () => {
        prismaMock.client.$transaction.mockResolvedValue([
            expectedReviews,
            18,
        ]);

        const result = await service.getPublicReviews(2, 5);

        expect(prismaMock.client.review.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    status: ReviewStatus.APPROVED,
                },
                skip: 5,
                take: 5,
            }),
        );

        expect(result.meta).toEqual({
            total: 18,
            page: 2,
            limit: 5,
            totalPages: 4,
        });
    });

    it('should return an empty list when there are no approved reviews', async () => {
        prismaMock.client.$transaction.mockResolvedValue([
            [],
            0,
        ]);

        const result = await service.getPublicReviews();

        expect(result).toEqual({
            data: [],
            meta: {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            },
        });

        expect(prismaMock.client.review.findMany).toHaveBeenCalledTimes(1);
        expect(prismaMock.client.review.count).toHaveBeenCalledTimes(1);
    });

    it('should propagate database errors when the transaction fails', async () => {
        const databaseError = new Error(
            'Database connection failed',
        );

        prismaMock.client.$transaction.mockRejectedValue(databaseError);

        await expect(
            service.getPublicReviews(),
        ).rejects.toBe(databaseError);
    });
});