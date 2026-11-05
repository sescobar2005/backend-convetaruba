import { beforeEach, describe, expect, it } from 'vitest';

import { Role, ReviewStatus } from '../../../generated/prisma/enums.js';

import { createReviewsServiceTestContext } from './reviews.service.test-utils.js';

describe('ReviewsService - getReviewById', () => {
    let service: ReturnType<typeof createReviewsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createReviewsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createReviewsServiceTestContext());
    });

    const reviewId = 'c5f8a312-7d46-4e91-8b25-6a3f9d0c2e71';
    const appointmentId = 'a4e7c921-6b35-4d82-9f10-3c8a5e2b7d64';
    const customerId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const anotherCustomerId = '8c9f4d3b-0a52-4e76-9b23-4f7a6d1c0e85';
    const petId = 'd6a9b423-8f57-4c02-9d36-7b4e1a5f3c82';
    const branchId = 'e7b0c534-9a68-4d13-8e47-2c5f6a1b3d90';
    const serviceId = 'f8c1d645-0b79-4e24-9f58-3d6a7b2c4e01';

    const expectedReview = {
        idReview: reviewId,
        rating: 5,
        comment: 'Excelente atención veterinaria.',
        status: ReviewStatus.PENDING,
        createdAt: new Date('2026-10-28T14:30:00.000Z'),
        updatedAt: new Date('2026-10-28T15:00:00.000Z'),
        appointment: {
            idAppointment: appointmentId,
            customerId,
            startsAt: new Date('2026-10-27T14:00:00.000Z'),
            completedAt: new Date('2026-10-27T14:45:00.000Z'),
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
    };

    it('should allow an administrator to retrieve any review', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(expectedReview);

        const result = await service.getReviewById(
            reviewId,
            anotherCustomerId,
            Role.ADMIN,
        );

        expect(result).toEqual(expectedReview);

        expect(prismaMock.client.review.findUnique).toHaveBeenCalledWith({
            where: {
                idReview: reviewId,
            },
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
                        customerId: true,
                        startsAt: true,
                        completedAt: true,
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
        });
    });

    it('should allow a customer to retrieve their own review', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(expectedReview);

        const result = await service.getReviewById(
            reviewId,
            customerId,
            Role.CUSTOMER,
        );

        expect(result).toEqual(expectedReview);
        expect(result.appointment.customerId).toBe(customerId);
    });

    it('should reject a customer attempting to retrieve another customer review', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(expectedReview);

        await expect(
            service.getReviewById(
                reviewId,
                anotherCustomerId,
                Role.CUSTOMER,
            ),
        ).rejects.toMatchObject({
            status: 403,
            message: 'You are not authorized to access this review',
        });
    });

    it('should reject staff members attempting to retrieve individual reviews', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(expectedReview);

        await expect(
            service.getReviewById(
                reviewId,
                anotherCustomerId,
                Role.STAFF,
            ),
        ).rejects.toMatchObject({
            status: 403,
            message: 'You are not authorized to access this review',
        });
    });

    it('should throw NotFoundException when the review does not exist', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(null);

        await expect(
            service.getReviewById(
                reviewId,
                customerId,
                Role.CUSTOMER,
            ),
        ).rejects.toMatchObject({
            status: 404,
            message: 'Review not found',
        });
    });
});