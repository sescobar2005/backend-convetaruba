import {
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';

import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './services/appointments.service.js';

describe('AppointmentsController', () => {
    let controller: AppointmentsController;

    const appointmentsServiceMock = {
        getAvailability: vi.fn(),
        getCustomerAppointments: vi.fn(),
        createAppointment: vi.fn(),
    };

    const customerRequest = {
        user: {
            sub: 'customer-uuid-123',
            role: 'CUSTOMER' as const,
            tokenVersion: 0,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();

        controller = new AppointmentsController(
            appointmentsServiceMock as unknown as AppointmentsService,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return the authenticated customer appointments', async () => {
        const appointments = [
            { idAppointment: 'appointment-uuid-123' },
        ];

        appointmentsServiceMock.getCustomerAppointments.mockResolvedValue(
            appointments,
        );

        const result = await controller.getMyAppointments(
            customerRequest as never,
        );

        expect(result).toEqual(appointments);

        expect(
            appointmentsServiceMock.getCustomerAppointments,
        ).toHaveBeenCalledWith(
            'customer-uuid-123',
            'customer-uuid-123',
            false,
        );
    });

    it('should reject staff users', () => {
        const request = {
            user: {
                sub: 'staff-uuid-123',
                role: 'STAFF' as const,
                tokenVersion: 0,
            },
        };

        expect(() => controller.getMyAppointments(request as never))
            .toThrow(ForbiddenException);

        expect(
            appointmentsServiceMock.getCustomerAppointments,
        ).not.toHaveBeenCalled();
    });

    it('should reject administrator users', () => {
        const request = {
            user: {
                sub: 'admin-uuid-123',
                role: 'ADMIN' as const,
                tokenVersion: 0,
            },
        };

        expect(() => controller.getMyAppointments(request as never))
            .toThrow(ForbiddenException);

        expect(
            appointmentsServiceMock.getCustomerAppointments,
        ).not.toHaveBeenCalled();
    });

    it('should reject requests without an authenticated user', () => {
        expect(() => controller.getMyAppointments({} as never))
            .toThrow(UnauthorizedException);

        expect(
            appointmentsServiceMock.getCustomerAppointments,
        ).not.toHaveBeenCalled();
    });
});