import { beforeEach, describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';

import { createNotificationsServiceTestContext } from './notifications.service.test-utils.js';

describe('NotificationsService - findAll', () => {
    let service: ReturnType<typeof createNotificationsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createNotificationsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createNotificationsServiceTestContext());
    });

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';

    const notifications = [
        {
            idNotification: '8c9f4d3b-1a52-4e76-9b23-4f7a6d1c0b85',
            userId,
            type: 'SYSTEM',
            title: 'System maintenance',
            message: 'Scheduled maintenance.',
            isRead: false,
            readAt: null,
            createdAt: new Date('2026-11-04T14:00:00.000Z'),
        },
    ];

    it('should return paginated notifications', async () => {
        prismaMock.client.notification.findMany.mockResolvedValue(notifications);
        prismaMock.client.notification.count
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(3);

        const result = await service.findAll(userId, 1, 20);

        expect(result).toEqual({
            data: notifications,
            pagination: {
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1,
            },
            unreadCount: 3,
        });

        expect(prismaMock.client.notification.findMany).toHaveBeenCalledWith({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip: 0,
            take: 20,
        });

        expect(prismaMock.client.notification.count).toHaveBeenNthCalledWith(
            1,
            { where: { userId } },
        );

        expect(prismaMock.client.notification.count).toHaveBeenNthCalledWith(
            2,
            { where: { userId, isRead: false } },
        );
    });

    it('should return only unread notifications when onlyUnread is true', async () => {
        prismaMock.client.notification.findMany.mockResolvedValue(notifications);
        prismaMock.client.notification.count
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(1);

        const result = await service.findAll(userId, 2, 10, true);

        expect(result.data).toEqual(notifications);

        expect(prismaMock.client.notification.findMany).toHaveBeenCalledWith({
            where: {
                userId,
                isRead: false,
            },
            orderBy: { createdAt: 'desc' },
            skip: 10,
            take: 10,
        });

        expect(prismaMock.client.notification.count).toHaveBeenNthCalledWith(
            1,
            { where: { userId, isRead: false } },
        );
    });

    it('should throw BadRequestException when the page is invalid', async () => {
        await expect(
            service.findAll(userId, 0, 20),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.notification.findMany).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the limit is invalid', async () => {
        await expect(
            service.findAll(userId, 1, 101),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.notification.findMany).not.toHaveBeenCalled();
    });

    it('should propagate a database error', async () => {
        const databaseError = new Error('Database unavailable');

        prismaMock.client.notification.findMany.mockRejectedValue(databaseError);

        await expect(
            service.findAll(userId, 1, 20),
        ).rejects.toBe(databaseError);
    });
});