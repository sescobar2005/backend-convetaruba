import {
    describe,
    expect,
    it,
} from 'vitest';

import { AppService } from './app.service.js';

describe('AppService', () => {
    let appService: AppService;

    beforeEach(() => {
        appService = new AppService();
    });

    describe('getHealth', () => {
        it('should return the health status', () => {
            expect(appService.getHealth()).toEqual({
                status: 'ok',
                service: 'convetaruba-api',
            });
        });
    });
});