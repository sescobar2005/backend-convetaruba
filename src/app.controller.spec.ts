import {
    describe,
    expect,
    it,
    vi,
    beforeEach,
} from 'vitest';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
    let appController: AppController;
    let appServiceMock: {
        getHealth: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        appServiceMock = {
            getHealth: vi.fn(),
        };

        appController = new AppController(
            appServiceMock as unknown as AppService,
        );
    });

    describe('getHealth', () => {
        it('should return the health status provided by AppService', () => {
            const healthResponse = {
                status: 'ok',
                service: 'convetaruba-api',
            };

            appServiceMock.getHealth.mockReturnValue(healthResponse);

            const result = appController.getHealth();

            expect(result).toEqual(healthResponse);
            expect(appServiceMock.getHealth).toHaveBeenCalledTimes(1);
        });

        it('should propagate errors thrown by AppService', () => {
            const error = new Error('Health check failed');

            appServiceMock.getHealth.mockImplementation(() => {
                throw error;
            });

            expect(() => appController.getHealth()).toThrow(error);
            expect(appServiceMock.getHealth).toHaveBeenCalledTimes(1);
        });
    });
});