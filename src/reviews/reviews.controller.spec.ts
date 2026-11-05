import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';

import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';

describe('ReviewsController', () => {
    let controller: ReviewsController;

    const reviewsServiceMock = {
        createReview: vi.fn(),
        getMyReviews: vi.fn(),
        getPublicReviews: vi.fn(),
        getReviews: vi.fn(),
        getReviewById: vi.fn(),
        updateReview: vi.fn(),
        moderateReview: vi.fn(),
    };

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const otherUserId = '2d9a6f81-4c37-4b52-9e16-8a0f3c7d5b21';
    const reviewId = '3f5a7c91-2d84-4b16-9e32-6a1c8d5f7042';

    const customerRequest = {
        user: {
            sub: userId,
            role: 'CUSTOMER' as const,
            tokenVersion: 0,
        },
    };

    const staffRequest = {
        user: {
            sub: otherUserId,
            role: 'STAFF' as const,
            tokenVersion: 0,
        },
    };

    const adminRequest = {
        user: {
            sub: otherUserId,
            role: 'ADMIN' as const,
            tokenVersion: 0,
        },
    };

    beforeEach(async () => {
        vi.resetAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ReviewsController],
            providers: [
                {
                    provide: ReviewsService,
                    useValue: reviewsServiceMock,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: vi.fn(() => true),
            })
            .overrideGuard(RolesGuard)
            .useValue({
                canActivate: vi.fn(() => true),
            })
            .compile();

        controller = module.get<ReviewsController>(ReviewsController);
    });

    describe('createReview', () => {
        it('should create a review for the authenticated customer', async () => {
            const dto = {
                appointmentId: '8c6d4a21-5f93-4b72-9e10-3a7c2d8f6145',
                rating: 5,
                comment: 'Excellent veterinary service',
            };

            const expectedResult = {
                idReview: reviewId,
                rating: 5,
                comment: 'Excellent veterinary service',
                status: 'PENDING',
            };

            reviewsServiceMock.createReview.mockResolvedValue(expectedResult);

            await expect(
                controller.createReview(dto, customerRequest as never),
            ).resolves.toEqual(expectedResult);

            expect(reviewsServiceMock.createReview).toHaveBeenCalledWith(
                userId,
                dto,
            );
            expect(reviewsServiceMock.createReview).toHaveBeenCalledTimes(1);
        });

        it('should reject requests without an authenticated user identity', () => {
            expect(() =>
                controller.createReview(
                    {
                        appointmentId: '8c6d4a21-5f93-4b72-9e10-3a7c2d8f6145',
                        rating: 5,
                    },
                    {} as never,
                ),
            ).toThrow(
                new UnauthorizedException('User identity is missing'),
            );

            expect(reviewsServiceMock.createReview).not.toHaveBeenCalled();
        });

        it('should propagate service errors', async () => {
            reviewsServiceMock.createReview.mockRejectedValue(
                new Error('Review creation failed'),
            );

            await expect(
                controller.createReview(
                    {
                        appointmentId: '8c6d4a21-5f93-4b72-9e10-3a7c2d8f6145',
                        rating: 5,
                    },
                    customerRequest as never,
                ),
            ).rejects.toThrow('Review creation failed');
        });
    });

    describe('getMyReviews', () => {
        it('should return the authenticated customer reviews', async () => {
            const query = {
                page: 1,
                limit: 10,
            };

            const expectedResult = {
                data: [
                    {
                        idReview: reviewId,
                        rating: 5,
                        status: 'PENDING',
                    },
                ],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
            };

            reviewsServiceMock.getMyReviews.mockResolvedValue(expectedResult);

            await expect(
                controller.getMyReviews(query, customerRequest as never),
            ).resolves.toEqual(expectedResult);

            expect(reviewsServiceMock.getMyReviews).toHaveBeenCalledWith(
                userId,
                1,
                10,
            );
            expect(reviewsServiceMock.getMyReviews).toHaveBeenCalledTimes(1);
        });

        it('should reject requests without an authenticated user identity', () => {
            expect(() =>
                controller.getMyReviews(
                    { page: 1, limit: 10 },
                    {} as never,
                ),
            ).toThrow(
                new UnauthorizedException('User identity is missing'),
            );

            expect(reviewsServiceMock.getMyReviews).not.toHaveBeenCalled();
        });

        it('should propagate service errors', async () => {
            reviewsServiceMock.getMyReviews.mockRejectedValue(
                new Error('Customer reviews lookup failed'),
            );

            await expect(
                controller.getMyReviews(
                    { page: 1, limit: 10 },
                    customerRequest as never,
                ),
            ).rejects.toThrow('Customer reviews lookup failed');
        });
    });

    describe('getPublicReviews', () => {
        it('should return public reviews with pagination', async () => {
            const query = {
                page: 2,
                limit: 5,
            };

            const expectedResult = {
                data: [
                    {
                        idReview: reviewId,
                        rating: 5,
                    },
                ],
                meta: {
                    total: 6,
                    page: 2,
                    limit: 5,
                    totalPages: 2,
                },
            };

            reviewsServiceMock.getPublicReviews.mockResolvedValue(expectedResult);

            await expect(
                controller.getPublicReviews(query),
            ).resolves.toEqual(expectedResult);

            expect(reviewsServiceMock.getPublicReviews).toHaveBeenCalledWith(
                2,
                5,
            );
            expect(reviewsServiceMock.getPublicReviews).toHaveBeenCalledTimes(1);
        });

        it('should propagate service errors', async () => {
            reviewsServiceMock.getPublicReviews.mockRejectedValue(
                new Error('Public reviews lookup failed'),
            );

            await expect(
                controller.getPublicReviews({
                    page: 1,
                    limit: 10,
                }),
            ).rejects.toThrow('Public reviews lookup failed');
        });
    });

    describe('getReviews', () => {
        it('should return all reviews using the admin filters', async () => {
            const query = {
                page: 1,
                limit: 10,
                status: 'PENDING' as never,
            };

            const expectedResult = {
                data: [
                    {
                        idReview: reviewId,
                        rating: 4,
                        status: 'PENDING',
                    },
                ],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
            };

            reviewsServiceMock.getReviews.mockResolvedValue(expectedResult);

            await expect(
                controller.getReviews(query),
            ).resolves.toEqual(expectedResult);

            expect(reviewsServiceMock.getReviews).toHaveBeenCalledWith(query);
            expect(reviewsServiceMock.getReviews).toHaveBeenCalledTimes(1);
        });

        it('should propagate service errors', async () => {
            reviewsServiceMock.getReviews.mockRejectedValue(
                new Error('Reviews lookup failed'),
            );

            await expect(
                controller.getReviews({
                    page: 1,
                    limit: 10,
                }),
            ).rejects.toThrow('Reviews lookup failed');
        });
    });

    describe('getReviewById', () => {
        it('should allow a customer to request an individual review', async () => {
            const expectedResult = {
                idReview: reviewId,
                rating: 5,
                status: 'PENDING',
            };

            reviewsServiceMock.getReviewById.mockResolvedValue(expectedResult);

            await expect(
                controller.getReviewById(
                    reviewId,
                    customerRequest as never,
                ),
            ).resolves.toEqual(expectedResult);

            expect(reviewsServiceMock.getReviewById).toHaveBeenCalledWith(
                reviewId,
                userId,
                'CUSTOMER',
            );
        });

        it('should allow an administrator to request an individual review', async () => {
            const expectedResult = {
                idReview: reviewId,
                rating: 5,
                status: 'HIDDEN',
            };

            reviewsServiceMock.getReviewById.mockResolvedValue(expectedResult);

            await expect(
                controller.getReviewById(
                    reviewId,
                    adminRequest as never,
                ),
            ).resolves.toEqual(expectedResult);

            expect(reviewsServiceMock.getReviewById).toHaveBeenCalledWith(
                reviewId,
                otherUserId,
                'ADMIN',
            );
        });

        it('should reject requests without an authenticated user identity', () => {
            expect(() =>
                controller.getReviewById(reviewId, {} as never),
            ).toThrow(
                new UnauthorizedException('User identity is missing'),
            );

            expect(reviewsServiceMock.getReviewById).not.toHaveBeenCalled();
        });

        it('should reject requests without an authenticated user role', () => {
            expect(() =>
                controller.getReviewById(
                    reviewId,
                    {
                        user: {
                            sub: userId,
                            tokenVersion: 0,
                        },
                    } as never,
                ),
            ).toThrow(
                new UnauthorizedException('User role is missing'),
            );

            expect(reviewsServiceMock.getReviewById).not.toHaveBeenCalled();
        });

        it('should propagate service errors', async () => {
            reviewsServiceMock.getReviewById.mockRejectedValue(
                new Error('Review lookup failed'),
            );

            await expect(
                controller.getReviewById(
                    reviewId,
                    customerRequest as never,
                ),
            ).rejects.toThrow('Review lookup failed');
        });
    });

    describe('updateReview', () => {
        it('should update a review for the authenticated customer', async () => {
            const dto = {
                rating: 4,
                comment: 'Updated veterinary service review',
            };

            const expectedResult = {
                idReview: reviewId,
                rating: 4,
                comment: 'Updated veterinary service review',
                status: 'PENDING',
            };

            reviewsServiceMock.updateReview.mockResolvedValue(expectedResult);

            await expect(
                controller.updateReview(
                    reviewId,
                    dto,
                    customerRequest as never,
                ),
            ).resolves.toEqual(expectedResult);

            expect(reviewsServiceMock.updateReview).toHaveBeenCalledWith(
                reviewId,
                userId,
                dto,
            );
            expect(reviewsServiceMock.updateReview).toHaveBeenCalledTimes(1);
        });

        it('should reject requests without an authenticated user identity', () => {
            expect(() =>
                controller.updateReview(
                    reviewId,
                    { rating: 3 },
                    {} as never,
                ),
            ).toThrow(
                new UnauthorizedException('User identity is missing'),
            );

            expect(reviewsServiceMock.updateReview).not.toHaveBeenCalled();
        });

        it('should propagate service errors', async () => {
            reviewsServiceMock.updateReview.mockRejectedValue(
                new Error('Review update failed'),
            );

            await expect(
                controller.updateReview(
                    reviewId,
                    { rating: 3 },
                    customerRequest as never,
                ),
            ).rejects.toThrow('Review update failed');
        });
    });

    describe('moderateReview', () => {
        it('should moderate a review using the administrator decision', async () => {
            const dto = {
                status: 'APPROVED' as never,
            };

            const expectedResult = {
                idReview: reviewId,
                rating: 5,
                status: 'APPROVED',
            };

            reviewsServiceMock.moderateReview.mockResolvedValue(expectedResult);

            await expect(
                controller.moderateReview(reviewId, dto),
            ).resolves.toEqual(expectedResult);

            expect(reviewsServiceMock.moderateReview).toHaveBeenCalledWith(
                reviewId,
                dto,
            );
            expect(reviewsServiceMock.moderateReview).toHaveBeenCalledTimes(1);
        });

        it('should propagate service errors', async () => {
            reviewsServiceMock.moderateReview.mockRejectedValue(
                new Error('Review moderation failed'),
            );

            await expect(
                controller.moderateReview(
                    reviewId,
                    { status: 'HIDDEN' as never },
                ),
            ).rejects.toThrow('Review moderation failed');
        });
    });

    describe('route authorization metadata', () => {
        const reflector = new Reflector();

        it('should restrict review creation to customers', () => {
            expect(
                reflector.get<string[]>(
                    'roles',
                    ReviewsController.prototype.createReview,
                ),
            ).toEqual(['CUSTOMER']);
        });

        it('should restrict customer reviews lookup to customers', () => {
            expect(
                reflector.get<string[]>(
                    'roles',
                    ReviewsController.prototype.getMyReviews,
                ),
            ).toEqual(['CUSTOMER']);
        });

        it('should leave public reviews lookup without role restrictions', () => {
            expect(
                reflector.get<string[]>(
                    'roles',
                    ReviewsController.prototype.getPublicReviews,
                ),
            ).toBeUndefined();
        });

        it('should restrict all reviews lookup to administrators', () => {
            expect(
                reflector.get<string[]>(
                    'roles',
                    ReviewsController.prototype.getReviews,
                ),
            ).toEqual(['ADMIN']);
        });

        it('should allow customers and administrators to access individual reviews', () => {
            expect(
                reflector.get<string[]>(
                    'roles',
                    ReviewsController.prototype.getReviewById,
                ),
            ).toEqual(['CUSTOMER', 'ADMIN']);
        });

        it('should restrict review updates to customers', () => {
            expect(
                reflector.get<string[]>(
                    'roles',
                    ReviewsController.prototype.updateReview,
                ),
            ).toEqual(['CUSTOMER']);
        });

        it('should restrict review moderation to administrators', () => {
            expect(
                reflector.get<string[]>(
                    'roles',
                    ReviewsController.prototype.moderateReview,
                ),
            ).toEqual(['ADMIN']);
        });
    });
});