import { beforeEach, describe, expect, it } from 'vitest';

import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { ReviewStatus } from '../../../generated/prisma/enums.js';

import { createReviewsServiceTestContext } from './reviews.service.test-utils.js';

describe('ReviewsService - updateReview', () => {
    let service: ReturnType<typeof createReviewsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createReviewsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createReviewsServiceTestContext());
    });

    const customerId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const anotherCustomerId = '8c9f4d3b-0a52-4e76-9b23-4f7a6d1c0e85';
    const reviewId = 'c5f8a312-7d46-4e91-8b25-6a3f9d0c2e71';

    const existingReview = {
        idReview: reviewId,
        status: ReviewStatus.APPROVED,
        appointment: {
            customerId,
        },
    };

    it('should allow a customer to update their review rating', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(existingReview);

        const updatedReview = {
            idReview: reviewId,
            rating: 4,
            comment: 'Excelente atención veterinaria.',
            status: ReviewStatus.PENDING,
        };

        prismaMock.client.review.update.mockResolvedValue(updatedReview);

        const result = await service.updateReview(
            reviewId,
            customerId,
            { rating: 4 },
        );

        expect(result).toEqual(updatedReview);

        expect(prismaMock.client.review.update).toHaveBeenCalledWith({
            where: {
                idReview: reviewId,
            },
            data: {
                rating: 4,
                status: ReviewStatus.PENDING,
            },
        });
    });

    it('should allow a customer to update their review comment', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(existingReview);

        const updatedReview = {
            idReview: reviewId,
            rating: 5,
            comment: 'La atención fue excelente y muy profesional.',
            status: ReviewStatus.PENDING,
        };

        prismaMock.client.review.update.mockResolvedValue(updatedReview);

        const result = await service.updateReview(
            reviewId,
            customerId,
            {
                comment: 'La atención fue excelente y muy profesional.',
            },
        );

        expect(result).toEqual(updatedReview);

        expect(prismaMock.client.review.update).toHaveBeenCalledWith({
            where: {
                idReview: reviewId,
            },
            data: {
                comment: 'La atención fue excelente y muy profesional.',
                status: ReviewStatus.PENDING,
            },
        });
    });

    it('should trim the comment and return the review to pending status', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(existingReview);

        const updatedReview = {
            idReview: reviewId,
            rating: 5,
            comment: 'La atención fue excelente.',
            status: ReviewStatus.PENDING,
        };

        prismaMock.client.review.update.mockResolvedValue(updatedReview);

        const result = await service.updateReview(
            reviewId,
            customerId,
            {
                comment: '  La atención fue excelente.  ',
            },
        );

        expect(result).toEqual(updatedReview);

        expect(prismaMock.client.review.update).toHaveBeenCalledWith({
            where: {
                idReview: reviewId,
            },
            data: {
                comment: 'La atención fue excelente.',
                status: ReviewStatus.PENDING,
            },
        });
    });

    it('should reject a customer attempting to update another customer review', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(existingReview);

        await expect(
            service.updateReview(
                reviewId,
                anotherCustomerId,
                { rating: 3 },
            ),
        ).rejects.toBeInstanceOf(ForbiddenException);

        expect(prismaMock.client.review.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the review does not exist', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(null);

        await expect(
            service.updateReview(
                reviewId,
                customerId,
                { rating: 4 },
            ),
        ).rejects.toBeInstanceOf(NotFoundException);

        expect(prismaMock.client.review.update).not.toHaveBeenCalled();
    });

    it('should propagate database errors when the update fails', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(existingReview);

        const databaseError = new Error(
            'Database connection failed',
        );

        prismaMock.client.review.update.mockRejectedValue(databaseError);

        await expect(
            service.updateReview(
                reviewId,
                customerId,
                { rating: 4 },
            ),
        ).rejects.toBe(databaseError);
    });
});