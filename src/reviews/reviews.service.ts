import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import {
    AppointmentStatus,
    ReviewStatus,
    Role,
} from '../../generated/prisma/enums.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { ReviewQueryDto } from './dto/review-query.dto.js';
import { ModerateReviewDto } from './dto/moderate-review.dto.js';

@Injectable()
export class ReviewsService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async createReview(
        requestingUserId: string,
        dto: CreateReviewDto,
    ) {
        const appointment = await this.prisma.client.appointment.findUnique({
            where: {
                idAppointment: dto.appointmentId,
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

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        if (appointment.customerId !== requestingUserId) {
            throw new ForbiddenException(
                'You are not authorized to review this appointment',
            );
        }

        if (appointment.status !== AppointmentStatus.COMPLETED) {
            throw new BadRequestException(
                'Only completed appointments can be reviewed',
            );
        }

        if (appointment.review) {
            throw new ConflictException(
                'This appointment already has a review',
            );
        }

        try {
            return await this.prisma.client.review.create({
                data: {
                    appointmentId: appointment.idAppointment,
                    rating: dto.rating,
                    comment: dto.comment?.trim(),
                    status: ReviewStatus.PENDING,
                },
            });
        } catch (error) {
            if (
                error !== null &&
                typeof error === 'object' &&
                'code' in error &&
                error.code === 'P2002'
            ) {
                throw new ConflictException(
                    'This appointment already has a review',
                );
            }

            throw error;
        }
    }

    async getMyReviews(
        requestingUserId: string,
        page: number = 1,
        limit: number = 10,
    ) {
        const skip = (page - 1) * limit;

        const where = {
            appointment: {
                customerId: requestingUserId,
            },
        };

        const [reviews, total] = await this.prisma.client.$transaction([
            this.prisma.client.review.findMany({
                where,
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
                skip,
                take: limit,
            }),
            this.prisma.client.review.count({
                where,
            }),
        ]);

        return {
            data: reviews,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getPublicReviews(
        page: number = 1,
        limit: number = 10,
    ) {
        const skip = (page - 1) * limit;

        const where = {
            status: ReviewStatus.APPROVED,
        };

        const [reviews, total] = await this.prisma.client.$transaction([
            this.prisma.client.review.findMany({
                where,
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
                skip,
                take: limit,
            }),
            this.prisma.client.review.count({
                where,
            }),
        ]);

        return {
            data: reviews,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getReviews(
        query: ReviewQueryDto,
    ) {
        const { page, limit, status } = query;
        const skip = (page - 1) * limit;

        const where = status ? { status } : {};

        const [reviews, total] = await this.prisma.client.$transaction([
            this.prisma.client.review.findMany({
                where,
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
                skip,
                take: limit,
            }),
            this.prisma.client.review.count({
                where,
            }),
        ]);

        return {
            data: reviews,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getReviewById(
        idReview: string,
        requestingUserId: string,
        requestingUserRole: Role,
    ) {
        const review = await this.prisma.client.review.findUnique({
            where: {
                idReview,
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

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (requestingUserRole === Role.ADMIN) {
            return review;
        }

        if (
            requestingUserRole === Role.CUSTOMER &&
            review.appointment.customerId === requestingUserId
        ) {
            return review;
        }

        throw new ForbiddenException(
            'You are not authorized to access this review',
        );
    }

    async updateReview(
        idReview: string,
        requestingUserId: string,
        dto: UpdateReviewDto,
    ) {
        const review = await this.prisma.client.review.findUnique({
            where: {
                idReview,
            },
            select: {
                idReview: true,
                status: true,
                appointment: {
                    select: {
                        customerId: true,
                    },
                },
            },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.appointment.customerId !== requestingUserId) {
            throw new ForbiddenException(
                'You are not authorized to update this review',
            );
        }

        const data = {
            ...(dto.rating !== undefined && {
                rating: dto.rating,
            }),
            ...(dto.comment !== undefined && {
                comment: dto.comment.trim(),
            }),
            status: ReviewStatus.PENDING,
        };

        return this.prisma.client.review.update({
            where: {
                idReview,
            },
            data,
        });
    }

    async moderateReview(
        idReview: string,
        dto: ModerateReviewDto,
    ) {
        const review = await this.prisma.client.review.findUnique({
            where: {
                idReview,
            },
            select: {
                idReview: true,
            },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        return this.prisma.client.review.update({
            where: {
                idReview,
            },
            data: {
                status: dto.status,
            },
        });
    }
}