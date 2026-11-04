import { beforeEach, describe, expect, it } from 'vitest';

import { createNotificationsServiceTestContext } from './notifications.service.test-utils.js';

describe('NotificationsService - markAllAsRead', () => {
    let service: ReturnType<typeof createNotificationsServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createNotificationsServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createNotificationsServiceTestContext());
    });

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';

    it('should mark all unread notifications as read', async () => {
        prismaMock.client.notification.updateMany.mockResolvedValue({
            count: 5,
        });

        const result = await service.markAllAsRead(userId);

        expect(result).toEqual({
            updatedCount: 5,
        });

        expect(prismaMock.client.notification.updateMany).toHaveBeenCalledOnce();

        expect(prismaMock.client.notification.updateMany).toHaveBeenCalledWith({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: expect.any(Date),
            },
        });
    });

    it('should return zero when there are no unread notifications', async () => {
        prismaMock.client.notification.updateMany.mockResolvedValue({
            count: 0,
        });

        const result = await service.markAllAsRead(userId);

        expect(result).toEqual({
            updatedCount: 0,
        });

        expect(prismaMock.client.notification.updateMany).toHaveBeenCalledWith({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: expect.any(Date),
            },
        });
    });

    it('should propagate a database error', async () => {
        const databaseError = new Error('Database unavailable');

        prismaMock.client.notification.updateMany.mockRejectedValue(
            databaseError,
        );

        await expect(
            service.markAllAsRead(userId),
        ).rejects.toBe(databaseError);
    });
});