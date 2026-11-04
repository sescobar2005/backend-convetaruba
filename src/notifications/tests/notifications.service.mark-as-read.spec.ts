import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';

import { createNotificationsServiceTestContext } from './notifications.service.test-utils.js';

describe('NotificationsService - markAsRead', () => {
    let service: ReturnType<typeof createNotificationsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createNotificationsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createNotificationsServiceTestContext());
    });

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const notificationId = '8c9f4d3b-1a52-4e76-9b23-4f7a6d1c0b85';

    const existingNotification = {
        idNotification: notificationId,
        userId,
        type: 'SYSTEM',
        title: 'System maintenance',
        message: 'Scheduled maintenance.',
        isRead: false,
        readAt: null,
        createdAt: new Date('2026-11-04T14:00:00.000Z'),
    };

    it('should mark a notification as read', async () => {
        const updatedNotification = {
            ...existingNotification,
            isRead: true,
            readAt: new Date('2026-11-04T15:00:00.000Z'),
        };

        prismaMock.client.notification.findFirst.mockResolvedValue(
            existingNotification,
        );
        prismaMock.client.notification.update.mockResolvedValue(
            updatedNotification,
        );

        const result = await service.markAsRead(notificationId, userId);

        expect(result).toEqual(updatedNotification);

        expect(prismaMock.client.notification.findFirst).toHaveBeenCalledWith({
            where: {
                idNotification: notificationId,
                userId,
            },
        });

        expect(prismaMock.client.notification.update).toHaveBeenCalledWith({
            where: { idNotification: notificationId },
            data: {
                isRead: true,
                readAt: expect.any(Date),
            },
        });
    });

    it('should return the notification without updating when it is already read', async () => {
        const readNotification = {
            ...existingNotification,
            isRead: true,
            readAt: new Date('2026-11-04T14:30:00.000Z'),
        };

        prismaMock.client.notification.findFirst.mockResolvedValue(
            readNotification,
        );

        const result = await service.markAsRead(notificationId, userId);

        expect(result).toEqual(readNotification);
        expect(prismaMock.client.notification.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the notification does not exist', async () => {
        prismaMock.client.notification.findFirst.mockResolvedValue(null);

        await expect(
            service.markAsRead(notificationId, userId),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.notification.update).not.toHaveBeenCalled();
    });

    it('should not find a notification belonging to another user', async () => {
        prismaMock.client.notification.findFirst.mockResolvedValue(null);

        await expect(
            service.markAsRead(notificationId, 'another-user-id'),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.notification.findFirst).toHaveBeenCalledWith({
            where: {
                idNotification: notificationId,
                userId: 'another-user-id',
            },
        });

        expect(prismaMock.client.notification.update).not.toHaveBeenCalled();
    });

    it('should propagate a database error', async () => {
        const databaseError = new Error('Database unavailable');

        prismaMock.client.notification.findFirst.mockRejectedValue(databaseError);

        await expect(
            service.markAsRead(notificationId, userId),
        ).rejects.toBe(databaseError);
    });
});