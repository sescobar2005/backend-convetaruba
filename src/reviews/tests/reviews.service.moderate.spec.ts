import { beforeEach, describe, expect, it } from 'vitest';

import { NotFoundException } from '@nestjs/common';

import { ReviewStatus } from '../../../generated/prisma/enums.js';

import { ModerateReviewDto } from '../dto/moderate-review.dto.js';
import { createReviewsServiceTestContext } from './reviews.service.test-utils.js';

describe('ReviewsService - moderateReview', () => {
    let service: ReturnType<typeof createReviewsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createReviewsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createReviewsServiceTestContext());
    });

    const reviewId = 'c5f8a312-7d46-4e91-8b25-6a3f9d0c2e71';

    const existingReview = {
        idReview: reviewId,
    };

    it('should approve a review', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(existingReview);

        const dto: ModerateReviewDto = {
            status: ReviewStatus.APPROVED,
        };

        const approvedReview = {
            idReview: reviewId,
            status: ReviewStatus.APPROVED,
        };

        prismaMock.client.review.update.mockResolvedValue(approvedReview);

        const result = await service.moderateReview(reviewId, dto);

        expect(result).toEqual(approvedReview);

        expect(prismaMock.client.review.findUnique).toHaveBeenCalledWith({
            where: {
                idReview: reviewId,
            },
            select: {
                idReview: true,
            },
        });

        expect(prismaMock.client.review.update).toHaveBeenCalledWith({
            where: {
                idReview: reviewId,
            },
            data: {
                status: ReviewStatus.APPROVED,
            },
        });
    });

    it('should hide a review', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(existingReview);

        const dto: ModerateReviewDto = {
            status: ReviewStatus.HIDDEN,
        };

        const hiddenReview = {
            idReview: reviewId,
            status: ReviewStatus.HIDDEN,
        };

        prismaMock.client.review.update.mockResolvedValue(hiddenReview);

        const result = await service.moderateReview(reviewId, dto);

        expect(result).toEqual(hiddenReview);

        expect(prismaMock.client.review.update).toHaveBeenCalledWith({
            where: {
                idReview: reviewId,
            },
            data: {
                status: ReviewStatus.HIDDEN,
            },
        });
    });

    it('should allow a hidden review to be approved again', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(existingReview);

        const dto: ModerateReviewDto = {
            status: ReviewStatus.APPROVED,
        };

        prismaMock.client.review.update.mockResolvedValue({
            idReview: reviewId,
            status: ReviewStatus.APPROVED,
        });

        const result = await service.moderateReview(reviewId, dto);

        expect(result.status).toBe(ReviewStatus.APPROVED);
    });

    it('should allow an approved review to be hidden again', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(existingReview);

        const dto: ModerateReviewDto = {
            status: ReviewStatus.HIDDEN,
        };

        prismaMock.client.review.update.mockResolvedValue({
            idReview: reviewId,
            status: ReviewStatus.HIDDEN,
        });

        const result = await service.moderateReview(reviewId, dto);

        expect(result.status).toBe(ReviewStatus.HIDDEN);
    });

    it('should throw NotFoundException when the review does not exist', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(null);

        const dto: ModerateReviewDto = {
            status: ReviewStatus.APPROVED,
        };

        await expect(
            service.moderateReview(reviewId, dto),
        ).rejects.toBeInstanceOf(NotFoundException);

        expect(prismaMock.client.review.update).not.toHaveBeenCalled();
    });

    it('should propagate database errors when the update fails', async () => {
        prismaMock.client.review.findUnique.mockResolvedValue(existingReview);

        const dto: ModerateReviewDto = {
            status: ReviewStatus.APPROVED,
        };

        const databaseError = new Error(
            'Database connection failed',
        );

        prismaMock.client.review.update.mockRejectedValue(databaseError);

        await expect(
            service.moderateReview(reviewId, dto),
        ).rejects.toBe(databaseError);
    });
});