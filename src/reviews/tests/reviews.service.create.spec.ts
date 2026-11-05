import { beforeEach, describe, expect, it } from 'vitest';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';

import {
    AppointmentStatus,
    ReviewStatus,
} from '../../../generated/prisma/enums.js';

import { createReviewsServiceTestContext } from './reviews.service.test-utils.js';

describe('ReviewsService - createReview', () => {
    let service: ReturnType<typeof createReviewsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createReviewsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createReviewsServiceTestContext());
    });

    const customerUserId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const anotherCustomerUserId = '2d9a6f81-4c37-4b52-9e16-8a0f3c7d5b21';
    const appointmentId = 'a4e7c921-6b35-4d82-9f10-3c8a5e2b7d64';
    const existingReviewId = 'c5f8a312-7d46-4e91-8b25-6a3f9d0c2e71';
    const createdReviewId = 'e6a9b423-8f57-4c02-9d36-7b4e1a5f3c82';

    const createReviewDto = {
        appointmentId,
        rating: 5,
        comment: 'Excelente atención. Mi mascota recibió un trato muy amable y profesional.',
    };

    const completedAppointment = {
        idAppointment: appointmentId,
        customerId: customerUserId,
        status: AppointmentStatus.COMPLETED,
        review: null,
    };

    const createdReview = {
        idReview: createdReviewId,
        appointmentId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
        status: ReviewStatus.PENDING,
        createdAt: new Date('2026-11-05T14:30:00.000Z'),
        updatedAt: new Date('2026-11-05T14:30:00.000Z'),
    };

    it('should throw NotFoundException when the appointment does not exist', async () => {
        prismaMock.client.appointment.findUnique.mockResolvedValue(null);

        await expect(
            service.createReview(customerUserId, createReviewDto),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.appointment.findUnique).toHaveBeenCalledWith({
            where: {
                idAppointment: appointmentId,
            },
            select: {
                idAppointment: true,
                customerId: true,
                status: true,
                review: {
                    select: {
                        idReview: true,
                    },
                },
            },
        });

        expect(prismaMock.client.review.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when the appointment belongs to another customer', async () => {
        prismaMock.client.appointment.findUnique.mockResolvedValue({
            ...completedAppointment,
            customerId: anotherCustomerUserId,
        });

        await expect(
            service.createReview(customerUserId, createReviewDto),
        ).rejects.toThrow(ForbiddenException);

        expect(prismaMock.client.appointment.findUnique).toHaveBeenCalledWith({
            where: {
                idAppointment: appointmentId,
            },
            select: {
                idAppointment: true,
                customerId: true,
                status: true,
                review: {
                    select: {
                        idReview: true,
                    },
                },
            },
        });

        expect(prismaMock.client.review.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the appointment is not completed', async () => {
        prismaMock.client.appointment.findUnique.mockResolvedValue({
            ...completedAppointment,
            status: AppointmentStatus.IN_PROGRESS,
        });

        await expect(
            service.createReview(customerUserId, createReviewDto),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.review.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the appointment already has a review', async () => {
        prismaMock.client.appointment.findUnique.mockResolvedValue({
            ...completedAppointment,
            review: {
                idReview: existingReviewId,
            },
        });

        await expect(
            service.createReview(customerUserId, createReviewDto),
        ).rejects.toThrow(ConflictException);

        expect(prismaMock.client.review.create).not.toHaveBeenCalled();
    });

    it('should create a pending review with the correct appointment, rating and trimmed comment', async () => {
        const dto = {
            ...createReviewDto,
            comment: `  ${createReviewDto.comment}  `,
        };

        const expectedReview = {
            ...createdReview,
            comment: createReviewDto.comment,
        };

        prismaMock.client.appointment.findUnique.mockResolvedValue(
            completedAppointment,
        );

        prismaMock.client.review.create.mockResolvedValue(expectedReview);

        const result = await service.createReview(customerUserId, dto);

        expect(prismaMock.client.appointment.findUnique).toHaveBeenCalledWith({
            where: {
                idAppointment: appointmentId,
            },
            select: {
                idAppointment: true,
                customerId: true,
                status: true,
                review: {
                    select: {
                        idReview: true,
                    },
                },
            },
        });

        expect(prismaMock.client.review.create).toHaveBeenCalledTimes(1);

        expect(prismaMock.client.review.create).toHaveBeenCalledWith({
            data: {
                appointmentId,
                rating: 5,
                comment: createReviewDto.comment,
                status: ReviewStatus.PENDING,
            },
        });

        expect(result).toEqual(expectedReview);
    });

    it('should create a pending review without a comment when the optional field is omitted', async () => {
        const { comment: _omitted, ...dtoWithoutComment } = createReviewDto;

        const expectedReview = {
            ...createdReview,
            comment: null,
        };

        prismaMock.client.appointment.findUnique.mockResolvedValue(
            completedAppointment,
        );

        prismaMock.client.review.create.mockResolvedValue(expectedReview);

        const result = await service.createReview(
            customerUserId,
            dtoWithoutComment,
        );

        expect(prismaMock.client.review.create).toHaveBeenCalledWith({
            data: {
                appointmentId,
                rating: 5,
                comment: undefined,
                status: ReviewStatus.PENDING,
            },
        });

        expect(result).toEqual(expectedReview);
    });

    it('should throw ConflictException when Prisma returns a unique constraint violation', async () => {
        prismaMock.client.appointment.findUnique.mockResolvedValue(
            completedAppointment,
        );

        prismaMock.client.review.create.mockRejectedValue({
            code: 'P2002',
            meta: {
                target: ['appointmentId'],
            },
        });

        await expect(
            service.createReview(customerUserId, createReviewDto),
        ).rejects.toThrow(ConflictException);

        expect(prismaMock.client.review.create).toHaveBeenCalledTimes(1);
    });

    it('should propagate unexpected database errors when review creation fails', async () => {
        const databaseError = new Error('Database connection failed');

        prismaMock.client.appointment.findUnique.mockResolvedValue(
            completedAppointment,
        );

        prismaMock.client.review.create.mockRejectedValue(databaseError);

        await expect(
            service.createReview(customerUserId, createReviewDto),
        ).rejects.toBe(databaseError);

        expect(prismaMock.client.review.create).toHaveBeenCalledTimes(1);
    });
});