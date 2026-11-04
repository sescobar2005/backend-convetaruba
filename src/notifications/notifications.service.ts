import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { NotificationType } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class NotificationsService {
    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async createNotification(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
    ) {
        return this.prismaService.client.notification.create({
            data: {
                userId,
                type,
                title,
                message,
            },
        });
    }

    async findAll(
        userId: string,
        page = 1,
        limit = 20,
        onlyUnread = false,
    ) {
        if (!Number.isInteger(page) || page < 1) {
            throw new BadRequestException(
                'Page must be a positive integer',
            );
        }

        if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
            throw new BadRequestException(
                'Limit must be between 1 and 100',
            );
        }

        const skip = (page - 1) * limit;

        const where = {
            userId,
            ...(onlyUnread ? { isRead: false } : {}),
        };

        const [notifications, total, unreadCount] = await Promise.all([
            this.prismaService.client.notification.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prismaService.client.notification.count({
                where,
            }),
            this.prismaService.client.notification.count({
                where: {
                    userId,
                    isRead: false,
                },
            }),
        ]);

        return {
            data: notifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            unreadCount,
        };
    }

    async markAsRead(
        notificationId: string,
        userId: string,
    ) {
        const notification =
            await this.prismaService.client.notification.findFirst({
                where: {
                    idNotification: notificationId,
                    userId,
                },
            });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        if (notification.isRead) {
            return notification;
        }

        return this.prismaService.client.notification.update({
            where: {
                idNotification: notificationId,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    async markAllAsRead(userId: string) {
        const result =
            await this.prismaService.client.notification.updateMany({
                where: {
                    userId,
                    isRead: false,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });

        return {
            updatedCount: result.count,
        };
    }
}