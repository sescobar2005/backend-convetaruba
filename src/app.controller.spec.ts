import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  const appServiceMock = {
    getHealth: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealth', () => {

    it('should return the health status provided by AppService', () => {
      const healthResponse = {
        status: 'ok',
        service: 'convetaruba-api'
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
    });

  });
});