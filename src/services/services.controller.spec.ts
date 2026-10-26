
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

describe('ServicesController', () => {
    let controller: ServicesController;

    let servicesService: {
        findPublishedServices: ReturnType<typeof vi.fn>;
        createService: ReturnType<typeof vi.fn>;
        updateService: ReturnType<typeof vi.fn>;
        deactivateService: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        servicesService = {
            findPublishedServices: vi.fn(),
            createService: vi.fn(),
            updateService: vi.fn(),
            deactivateService: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ServicesController],
            providers: [
                {
                    provide: ServicesService,
                    useValue: servicesService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: vi.fn().mockReturnValue(true),
            })
            .compile();

        controller = module.get<ServicesController>(ServicesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return published services', async () => {
        const services = [
            {
                idService: 'service-1',
                name: 'Consulta general',
                slug: 'consulta-general',
                isActive: true,
                isPublished: true,
            },
        ];

        servicesService.findPublishedServices.mockResolvedValue(services);

        await expect(
            controller.findPublishedServices(),
        ).resolves.toEqual(services);

        expect(servicesService.findPublishedServices).toHaveBeenCalledOnce();
    });

    it('should create a service', async () => {
        const createServiceDto = {
            name: 'Consulta general',
            slug: 'consulta-general',
            description: 'Consulta médica general',
            categoryId: '550e8400-e29b-41d4-a716-446655440000',
        };

        const createdService = {
            idService: '660e8400-e29b-41d4-a716-446655440000',
            ...createServiceDto,
            shortDescription: null,
            isActive: true,
            isPublished: false,
        };

        servicesService.createService.mockResolvedValue(createdService);

        await expect(
            controller.createService(createServiceDto),
        ).resolves.toEqual(createdService);

        expect(servicesService.createService).toHaveBeenCalledWith(
            createServiceDto,
        );

        expect(servicesService.createService).toHaveBeenCalledOnce();
    });

    it('should update a service', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        const updateServiceDto = {
            name: 'Consulta especializada',
            description: 'Servicio actualizado',
        };

        const updatedService = {
            idService,
            name: 'Consulta especializada',
            slug: 'consulta-general',
            description: 'Servicio actualizado',
            isActive: true,
            isPublished: false,
        };

        servicesService.updateService.mockResolvedValue(updatedService);

        await expect(
            controller.updateService(idService, updateServiceDto),
        ).resolves.toEqual(updatedService);

        expect(servicesService.updateService).toHaveBeenCalledWith(
            idService,
            updateServiceDto,
        );

        expect(servicesService.updateService).toHaveBeenCalledOnce();
    });

    it('should deactivate a service', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        const deactivatedService = {
            idService,
            name: 'Consulta general',
            slug: 'consulta-general',
            isActive: false,
        };

        servicesService.deactivateService.mockResolvedValue(deactivatedService);

        await expect(
            controller.deactivateService(idService),
        ).resolves.toEqual(deactivatedService);

        expect(servicesService.deactivateService).toHaveBeenCalledWith(
            idService,
        );

        expect(servicesService.deactivateService).toHaveBeenCalledOnce();
    });

});