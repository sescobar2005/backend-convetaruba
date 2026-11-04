import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

describe('NotificationsController', () => {
    let controller: NotificationsController;

    const notificationsServiceMock = {
        findAll: vi.fn(),
        markAsRead: vi.fn(),
        markAllAsRead: vi.fn(),
    };

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const notificationId = '8c9f4d3b-1a52-4e76-9b23-4f7a6d1c0b85';

    const customerRequest = {
        user: {
            sub: userId,
            role: 'CUSTOMER' as const,
            tokenVersion: 0,
        },
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [NotificationsController],
            providers: [
                {
                    provide: NotificationsService,
                    useValue: notificationsServiceMock,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: vi.fn(() => true),
            })
            .compile();

        controller = module.get<NotificationsController>(
            NotificationsController,
        );
    });

    describe('findAll', () => {
        it('should return the authenticated user notifications', async () => {
            const query = {
                page: 1,
                limit: 20,
                onlyUnread: false,
            };

            const expectedResult = {
                data: [],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                },
                unreadCount: 0,
            };

            notificationsServiceMock.findAll.mockResolvedValue(
                expectedResult,
            );

            await expect(
                controller.findAll(query, customerRequest as never),
            ).resolves.toEqual(expectedResult);

            expect(notificationsServiceMock.findAll).toHaveBeenCalledWith(
                userId,
                1,
                20,
                false,
            );
        });

        it('should propagate service errors', async () => {
            notificationsServiceMock.findAll.mockRejectedValue(
                new Error('Notification lookup failed'),
            );

            await expect(
                controller.findAll(
                    { page: 1, limit: 20, onlyUnread: false },
                    customerRequest as never,
                ),
            ).rejects.toThrow('Notification lookup failed');
        });

        it('should forbid access when the user identity is missing', () => {
            expect(() =>
                controller.findAll(
                    { page: 1, limit: 20, onlyUnread: false },
                    {} as never,
                ),
            ).toThrow(
                new ForbiddenException('User identity is missing'),
            );

            expect(notificationsServiceMock.findAll).not.toHaveBeenCalled();
        });
    });

    describe('markAsRead', () => {
        it('should mark the authenticated user notification as read', async () => {
            const expectedResult = {
                idNotification: notificationId,
                userId,
                isRead: true,
            };

            notificationsServiceMock.markAsRead.mockResolvedValue(
                expectedResult,
            );

            await expect(
                controller.markAsRead(
                    notificationId,
                    customerRequest as never,
                ),
            ).resolves.toEqual(expectedResult);

            expect(notificationsServiceMock.markAsRead).toHaveBeenCalledWith(
                notificationId,
                userId,
            );
        });

        it('should propagate service errors', async () => {
            notificationsServiceMock.markAsRead.mockRejectedValue(
                new Error('Notification update failed'),
            );

            await expect(
                controller.markAsRead(
                    notificationId,
                    customerRequest as never,
                ),
            ).rejects.toThrow('Notification update failed');
        });

        it('should forbid access when the user identity is missing', () => {
            expect(() =>
                controller.markAsRead(
                    notificationId,
                    {} as never,
                ),
            ).toThrow(
                new ForbiddenException('User identity is missing'),
            );

            expect(notificationsServiceMock.markAsRead).not.toHaveBeenCalled();
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all authenticated user notifications as read', async () => {
            const expectedResult = {
                updatedCount: 5,
            };

            notificationsServiceMock.markAllAsRead.mockResolvedValue(
                expectedResult,
            );

            await expect(
                controller.markAllAsRead(customerRequest as never),
            ).resolves.toEqual(expectedResult);

            expect(
                notificationsServiceMock.markAllAsRead,
            ).toHaveBeenCalledWith(userId);
        });

        it('should propagate service errors', async () => {
            notificationsServiceMock.markAllAsRead.mockRejectedValue(
                new Error('Notifications update failed'),
            );

            await expect(
                controller.markAllAsRead(customerRequest as never),
            ).rejects.toThrow('Notifications update failed');
        });

        it('should forbid access when the user identity is missing', () => {
            expect(() =>
                controller.markAllAsRead({} as never),
            ).toThrow(
                new ForbiddenException('User identity is missing'),
            );

            expect(
                notificationsServiceMock.markAllAsRead,
            ).not.toHaveBeenCalled();
        });
    });
});