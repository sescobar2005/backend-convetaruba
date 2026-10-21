import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service.js';

describe('AppService', () => {
    let appService: AppService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AppService]
        }).compile();

        appService = module.get<AppService>(AppService);
    });

    describe('getHealth', () => {

        it('should return the health status', () => {
            expect(appService.getHealth()).toEqual({
                status: 'ok',
                service: 'convetaruba-api'
            });
        });
        
    });
});