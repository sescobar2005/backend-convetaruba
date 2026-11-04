import { beforeEach, describe, expect, it } from 'vitest';

import { NotificationType } from '../../../generated/prisma/enums.js';
import { createNotificationsServiceTestContext } from './notifications.service.test-utils.js';

describe('NotificationsService - createNotification', () => {
    let service: ReturnType<typeof createNotificationsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createNotificationsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createNotificationsServiceTestContext());
    });

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';

    const notificationData = {
        type: NotificationType.SYSTEM,
        title: 'System maintenance',
        message: 'The platform will be under maintenance.',
    };

    const createdNotification = {
        idNotification: '8c9f4d3b-1a52-4e76-9b23-4f7a6d1c0b85',
        userId,
        ...notificationData,
        isRead: false,
        readAt: null,
        createdAt: new Date('2026-11-04T14:00:00.000Z'),
    };

    it('should create a notification successfully', async () => {
        prismaMock.client.notification.create.mockResolvedValue(
            createdNotification,
        );

        const result = await service.createNotification(
            userId,
            notificationData.type,
            notificationData.title,
            notificationData.message,
        );

        expect(result).toEqual(createdNotification);

        expect(prismaMock.client.notification.create).toHaveBeenCalledOnce();

        expect(prismaMock.client.notification.create).toHaveBeenCalledWith({
            data: {
                userId,
                type: notificationData.type,
                title: notificationData.title,
                message: notificationData.message,
            },
        });
    });

    it('should propagate a database error', async () => {
        const databaseError = new Error('Database unavailable');

        prismaMock.client.notification.create.mockRejectedValue(databaseError);

        await expect(
            service.createNotification(
                userId,
                notificationData.type,
                notificationData.title,
                notificationData.message,
            ),
        ).rejects.toBe(databaseError);
    });
});