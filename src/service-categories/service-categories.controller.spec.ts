
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceCategoriesController } from './service-categories.controller.js';
import { ServiceCategoriesService } from './service-categories.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';

describe('ServiceCategoriesController', () => {
    let controller: ServiceCategoriesController;

    let serviceCategoriesService: {
        findActiveCategories: ReturnType<typeof vi.fn>;
        createCategory: ReturnType<typeof vi.fn>;
        updateCategory: ReturnType<typeof vi.fn>;
        updateCategoryStatus: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
        serviceCategoriesService = {
            findActiveCategories: vi.fn(),
            createCategory: vi.fn(),
            updateCategory: vi.fn(),
            updateCategoryStatus: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ServiceCategoriesController],
            providers: [
                {
                    provide: ServiceCategoriesService,
                    useValue: serviceCategoriesService,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: vi.fn().mockReturnValue(true) })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: vi.fn().mockReturnValue(true) })
            .compile();

        controller = module.get<ServiceCategoriesController>(
            ServiceCategoriesController,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return active categories', async () => {
        const categories = [
            {
                idCategory: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Consultas',
                slug: 'consultas',
                isActive: true,
            },
        ];

        serviceCategoriesService.findActiveCategories.mockResolvedValue(categories);

        await expect(
            controller.findActiveCategories(),
        ).resolves.toEqual(categories);

        expect(
            serviceCategoriesService.findActiveCategories,
        ).toHaveBeenCalledOnce();
    });

    it('should create a category', async () => {
        const createServiceCategoryDto = {
            name: 'Consultas',
            slug: 'consultas',
        };

        const createdCategory = {
            idCategory: '550e8400-e29b-41d4-a716-446655440000',
            ...createServiceCategoryDto,
            isActive: true,
        };

        serviceCategoriesService.createCategory.mockResolvedValue(createdCategory);

        await expect(
            controller.createCategory(createServiceCategoryDto),
        ).resolves.toEqual(createdCategory);

        expect(
            serviceCategoriesService.createCategory,
        ).toHaveBeenCalledWith(createServiceCategoryDto);

        expect(
            serviceCategoriesService.createCategory,
        ).toHaveBeenCalledOnce();
    });

    it('should update a category', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';

        const updateServiceCategoryDto = {
            name: 'Consultas especializadas',
        };

        const updatedCategory = {
            idCategory,
            name: 'Consultas especializadas',
            slug: 'consultas',
            isActive: true,
        };

        serviceCategoriesService.updateCategory.mockResolvedValue(updatedCategory);

        await expect(
            controller.updateCategory(idCategory, updateServiceCategoryDto),
        ).resolves.toEqual(updatedCategory);

        expect(
            serviceCategoriesService.updateCategory,
        ).toHaveBeenCalledWith(idCategory, updateServiceCategoryDto);

        expect(
            serviceCategoriesService.updateCategory,
        ).toHaveBeenCalledOnce();
    });

    it('should deactivate a category', async () => {
    const idCategory = '550e8400-e29b-41d4-a716-446655440000';

    const updateServiceCategoryStatusDto = {
        isActive: false,
    };

    const deactivatedCategory = {
        idCategory,
        name: 'Consultas',
        slug: 'consultas',
        isActive: false,
    };

    serviceCategoriesService.updateCategoryStatus.mockResolvedValue(
        deactivatedCategory,
    );

    await expect(
        controller.updateCategoryStatus(
            idCategory,
            updateServiceCategoryStatusDto,
        ),
    ).resolves.toEqual(deactivatedCategory);

    expect(
        serviceCategoriesService.updateCategoryStatus,
    ).toHaveBeenCalledWith(idCategory, updateServiceCategoryStatusDto);

    expect(
        serviceCategoriesService.updateCategoryStatus,
    ).toHaveBeenCalledOnce();
});

    it('should reactivate a category', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';

        const updateServiceCategoryStatusDto = {
            isActive: true,
        };

        const reactivatedCategory = {
            idCategory,
            name: 'Consultas',
            slug: 'consultas',
            isActive: true,
        };

        serviceCategoriesService.updateCategoryStatus.mockResolvedValue(
            reactivatedCategory,
        );

        await expect(
            controller.updateCategoryStatus(
                idCategory,
                updateServiceCategoryStatusDto,
            ),
        ).resolves.toEqual(reactivatedCategory);

        expect(
            serviceCategoriesService.updateCategoryStatus,
        ).toHaveBeenCalledWith(idCategory, updateServiceCategoryStatusDto);

        expect(
            serviceCategoriesService.updateCategoryStatus,
        ).toHaveBeenCalledOnce();
    });

});