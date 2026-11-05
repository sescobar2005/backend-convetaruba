import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles, UserRole } from '../auth/decorators/roles.decorator.js';

import { CreateReviewDto } from './dto/create-review.dto.js';
import { ModerateReviewDto } from './dto/moderate-review.dto.js';
import { ReviewQueryDto } from './dto/review-query.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';

import { ReviewsService } from './reviews.service.js';

interface AuthenticatedRequest extends Request {
    user?: {
        sub: string;
        role: UserRole;
        tokenVersion: number;
    };
}

@Controller('reviews')
export class ReviewsController {
    constructor(
        private readonly reviewsService: ReviewsService,
    ) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('CUSTOMER')
    createReview(
        @Body() dto: CreateReviewDto,
        @Req() request: AuthenticatedRequest,
    ) {
        const customerId = this.getAuthenticatedUserId(request);

        return this.reviewsService.createReview(
            customerId,
            dto,
        );
    }

    @Get('mine')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('CUSTOMER')
    getMyReviews(
        @Query() query: ReviewQueryDto,
        @Req() request: AuthenticatedRequest,
    ) {
        const customerId = this.getAuthenticatedUserId(request);

        return this.reviewsService.getMyReviews(
            customerId,
            query.page,
            query.limit,
        );
    }

    @Get('public')
    getPublicReviews(
        @Query() query: ReviewQueryDto,
    ) {
        return this.reviewsService.getPublicReviews(
            query.page,
            query.limit,
        );
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    getReviews(
        @Query() query: ReviewQueryDto,
    ) {
        return this.reviewsService.getReviews(query);
    }

    @Get(':idReview')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('CUSTOMER', 'ADMIN')
    getReviewById(
        @Param('idReview', new ParseUUIDPipe()) idReview: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const userId = this.getAuthenticatedUserId(request);
        const userRole = this.getAuthenticatedUserRole(request);

        return this.reviewsService.getReviewById(
            idReview,
            userId,
            userRole,
        );
    }

    @Patch(':idReview')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('CUSTOMER')
    updateReview(
        @Param('idReview', new ParseUUIDPipe()) idReview: string,
        @Body() dto: UpdateReviewDto,
        @Req() request: AuthenticatedRequest,
    ) {
        const customerId = this.getAuthenticatedUserId(request);

        return this.reviewsService.updateReview(
            idReview,
            customerId,
            dto,
        );
    }

    @Patch(':idReview/moderation')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    moderateReview(
        @Param('idReview', new ParseUUIDPipe()) idReview: string,
        @Body() dto: ModerateReviewDto,
    ) {
        return this.reviewsService.moderateReview(
            idReview,
            dto,
        );
    }

    private getAuthenticatedUserId(
        request: AuthenticatedRequest,
    ): string {
        const userId = request.user?.sub;

        if (!userId) {
            throw new UnauthorizedException('User identity is missing');
        }

        return userId;
    }

    private getAuthenticatedUserRole(
        request: AuthenticatedRequest,
    ): UserRole {
        const role = request.user?.role;

        if (!role) {
            throw new UnauthorizedException('User role is missing');
        }

        return role;
    }
}