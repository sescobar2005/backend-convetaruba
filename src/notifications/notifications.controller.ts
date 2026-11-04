import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    UseGuards,
    Req,
    ParseUUIDPipe,
    ForbiddenException,
} from '@nestjs/common';

import type { Request } from 'express';

import { NotificationsService } from './notifications.service.js';
import { NotificationQueryDto } from './dto/notification-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

interface AuthenticatedRequest extends Request {
    user?: {
        sub: string;
        role: UserRole;
        tokenVersion: number;
    };
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
    ) {}

    @Get()
    findAll(
        @Query() query: NotificationQueryDto,
        @Req() request: AuthenticatedRequest,
    ) {
        const userId = this.getAuthenticatedUserId(request);

        return this.notificationsService.findAll(
            userId,
            query.page,
            query.limit,
            query.onlyUnread,
        );
    }

    @Patch('read-all')
    markAllAsRead(
        @Req() request: AuthenticatedRequest,
    ) {
        const userId = this.getAuthenticatedUserId(request);

        return this.notificationsService.markAllAsRead(userId);
    }

    @Patch(':idNotification/read')
    markAsRead(
        @Param('idNotification', new ParseUUIDPipe()) idNotification: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const userId = this.getAuthenticatedUserId(request);

        return this.notificationsService.markAsRead(
            idNotification,
            userId,
        );
    }

    private getAuthenticatedUserId(
        request: AuthenticatedRequest,
    ): string {
        const userId = request.user?.sub;

        if (!userId) {
            throw new ForbiddenException('User identity is missing');
        }

        return userId;
    }
}