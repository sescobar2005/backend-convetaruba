import { Test, TestingModule } from '@nestjs/testing';

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { BranchServicesController } from './branch-services.controller.js';
import { BranchServicesService } from './branch-services.service.js';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles/roles.guard.js';

import { AssignBranchServiceDto } from './dto/assign-branch-service.dto.js';
import { UpdateBranchServicePriceDto } from './dto/update-branch-service-price.dto.js';
import { UpdateBranchServiceStatusDto } from './dto/update-branch-service-status.dto.js';

describe('BranchServicesController', () => {
    let controller: BranchServicesController;

    const branchServicesServiceMock = {
        assignServiceToBranch: vi.fn(),
        findBranchServices: vi.fn(),
        findServiceBranches: vi.fn(),
        updateBranchServiceStatus: vi.fn(),
        updateBranchServicePrice: vi.fn(),
        findBranchServicePriceHistory: vi.fn(),
    };

    const branchId = 'e5f6a7b8-c9d0-4123-8567-89abcdef0321';
    const serviceId = 'f6a7b8c9-d0e1-4234-9678-9abcdef01234';
    const branchServiceId = 'a7b8c9d0-e1f2-4345-a789-bcdef0123456';

    const branchServicePriceId = 'b8c9d0e1-f2a3-4456-8789-cdef01234567';
    const previousBranchServicePriceId = 'c9d0e1f2-a3b4-4567-989a-def012345678';

    const serviceCategoryId = 'd0e1f2a3-b4c5-4678-89ab-ef0123456789';

    const secondBranchId = 'e1f2a3b4-c5d6-4789-9abc-f01234567890';
    const secondBranchServiceId = 'f2a3b4c5-d6e7-489a-abcd-012345678901';
    const secondBranchServicePriceId = 'a3b4c5d6-e7f8-49ab-bcde-123456789012';

    const createdAt = new Date('2026-01-10T10:00:00.000Z');
    const updatedAt = new Date('2026-01-15T10:00:00.000Z');
    const previousValidFrom = new Date('2025-12-15T10:00:00.000Z');

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [BranchServicesController],
            providers: [
                {
                    provide: BranchServicesService,
                    useValue: branchServicesServiceMock,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: vi.fn().mockReturnValue(true),
            })
            .overrideGuard(RolesGuard)
            .useValue({
                canActivate: vi.fn().mockReturnValue(true),
            })
            .compile();

        controller = module.get<BranchServicesController>(
            BranchServicesController,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('assignServiceToBranch', () => {
        it('should assign an active veterinary service to a branch', () => {
            const dto: AssignBranchServiceDto = {
                serviceId,
            };

            const response = {
                idBranchService: branchServiceId,
                branchId,
                serviceId,
                isActive: true,
                createdAt,
                updatedAt,
                service: {
                    idService: serviceId,
                    name: 'Consulta veterinaria general',
                    isActive: true,
                    isPublished: true,
                },
                branch: {
                    idBranch: branchId,
                    name: 'Convetaruba Savaneta',
                    slug: 'convetaruba-savaneta',
                    address: 'Savaneta, Aruba',
                    city: 'Savaneta',
                    department: 'Aruba',
                    phone: null,
                    email: null,
                    isActive: true,
                },
            };

            branchServicesServiceMock.assignServiceToBranch.mockReturnValue(
                response,
            );

            const result = controller.assignServiceToBranch(branchId, dto);

            expect(result).toEqual(response);
            expect(
                branchServicesServiceMock.assignServiceToBranch,
            ).toHaveBeenCalledTimes(1);
            expect(
                branchServicesServiceMock.assignServiceToBranch,
            ).toHaveBeenCalledWith(branchId, dto);
        });
    });

    describe('findBranchServices', () => {
        it('should return all services assigned to a branch', () => {
            const response = [
                {
                    idBranchService: branchServiceId,
                    branchId,
                    serviceId,
                    isActive: true,
                    createdAt,
                    updatedAt,
                    service: {
                        idService: serviceId,
                        name: 'Consulta veterinaria general',
                        isActive: true,
                        isPublished: true,
                        category: {
                            idServiceCategory: serviceCategoryId,
                            name: 'Consultas',
                            isActive: true,
                        },
                    },
                    prices: [
                        {
                            idBranchServicePrice: branchServicePriceId,
                            branchServiceId,
                            amount: '85000.00',
                            validFrom: updatedAt,
                            validUntil: null,
                            createdAt: updatedAt,
                        },
                    ],
                },
            ];

            branchServicesServiceMock.findBranchServices.mockReturnValue(
                response,
            );

            const result = controller.findBranchServices(branchId);

            expect(result).toEqual(response);
            expect(
                branchServicesServiceMock.findBranchServices,
            ).toHaveBeenCalledTimes(1);
            expect(
                branchServicesServiceMock.findBranchServices,
            ).toHaveBeenCalledWith(branchId);
        });
    });

    describe('findServiceBranches', () => {
        it('should return all branches offering a veterinary service', () => {
            const response = [
                {
                    idBranchService: branchServiceId,
                    branchId,
                    serviceId,
                    isActive: true,
                    createdAt,
                    updatedAt,
                    branch: {
                        idBranch: branchId,
                        name: 'Convetaruba Savaneta',
                        slug: 'convetaruba-savaneta',
                        address: 'Savaneta, Aruba',
                        city: 'Savaneta',
                        department: 'Aruba',
                        phone: null,
                        email: null,
                        isActive: true,
                    },
                    prices: [
                        {
                            idBranchServicePrice: branchServicePriceId,
                            branchServiceId,
                            amount: '85000.00',
                            validFrom: updatedAt,
                            validUntil: null,
                            createdAt: updatedAt,
                        },
                    ],
                },
                {
                    idBranchService: secondBranchServiceId,
                    branchId: secondBranchId,
                    serviceId,
                    isActive: true,
                    createdAt,
                    updatedAt,
                    branch: {
                        idBranch: secondBranchId,
                        name: 'Convetaruba Savaneta - Sede secundaria',
                        slug: 'convetaruba-savaneta-secundaria',
                        address: 'Savaneta, Aruba',
                        city: 'Savaneta',
                        department: 'Aruba',
                        phone: null,
                        email: null,
                        isActive: true,
                    },
                    prices: [
                        {
                            idBranchServicePrice: secondBranchServicePriceId,
                            branchServiceId: secondBranchServiceId,
                            amount: '90000.00',
                            validFrom: updatedAt,
                            validUntil: null,
                            createdAt: updatedAt,
                        },
                    ],
                },
            ];

            branchServicesServiceMock.findServiceBranches.mockReturnValue(
                response,
            );

            const result = controller.findServiceBranches(serviceId);

            expect(result).toEqual(response);
            expect(
                branchServicesServiceMock.findServiceBranches,
            ).toHaveBeenCalledTimes(1);
            expect(
                branchServicesServiceMock.findServiceBranches,
            ).toHaveBeenCalledWith(serviceId);
        });
    });

    describe('updateBranchServiceStatus', () => {
        it('should deactivate a service assigned to a branch', () => {
            const dto: UpdateBranchServiceStatusDto = {
                isActive: false,
            };

            const response = {
                idBranchService: branchServiceId,
                branchId,
                serviceId,
                isActive: false,
                createdAt,
                updatedAt,
                service: {
                    idService: serviceId,
                    name: 'Consulta veterinaria general',
                    isActive: true,
                    isPublished: true,
                },
                branch: {
                    idBranch: branchId,
                    name: 'Convetaruba Savaneta',
                    slug: 'convetaruba-savaneta',
                    address: 'Savaneta, Aruba',
                    city: 'Savaneta',
                    department: 'Aruba',
                    phone: null,
                    email: null,
                    isActive: true,
                },
            };

            branchServicesServiceMock.updateBranchServiceStatus.mockReturnValue(
                response,
            );

            const result = controller.updateBranchServiceStatus(
                branchId,
                branchServiceId,
                dto,
            );

            expect(result).toEqual(response);
            expect(
                branchServicesServiceMock.updateBranchServiceStatus,
            ).toHaveBeenCalledTimes(1);
            expect(
                branchServicesServiceMock.updateBranchServiceStatus,
            ).toHaveBeenCalledWith(
                branchId,
                branchServiceId,
                dto.isActive,
            );
        });
    });

    describe('updateBranchServicePrice', () => {
        it('should update the price of a service assigned to a branch', () => {
            const dto: UpdateBranchServicePriceDto = {
                amount: 95000,
            };

            const response = {
                idBranchServicePrice: branchServicePriceId,
                branchServiceId,
                amount: '95000.00',
                validFrom: updatedAt,
                validUntil: null,
                createdAt: updatedAt,
            };

            branchServicesServiceMock.updateBranchServicePrice.mockReturnValue(
                response,
            );

            const result = controller.updateBranchServicePrice(
                branchId,
                branchServiceId,
                dto,
            );

            expect(result).toEqual(response);
            expect(
                branchServicesServiceMock.updateBranchServicePrice,
            ).toHaveBeenCalledTimes(1);
            expect(
                branchServicesServiceMock.updateBranchServicePrice,
            ).toHaveBeenCalledWith(
                branchId,
                branchServiceId,
                dto,
            );
        });
    });

    describe('findBranchServicePriceHistory', () => {
        it('should return the price history ordered from newest to oldest', () => {
            const response = [
                {
                    idBranchServicePrice: branchServicePriceId,
                    branchServiceId,
                    amount: '95000.00',
                    validFrom: updatedAt,
                    validUntil: null,
                    createdAt: updatedAt,
                },
                {
                    idBranchServicePrice: previousBranchServicePriceId,
                    branchServiceId,
                    amount: '85000.00',
                    validFrom: previousValidFrom,
                    validUntil: updatedAt,
                    createdAt: previousValidFrom,
                },
            ];

            branchServicesServiceMock.findBranchServicePriceHistory.mockReturnValue(
                response,
            );

            const result = controller.findBranchServicePriceHistory(
                branchId,
                branchServiceId,
            );

            expect(result).toEqual(response);
            expect(
                branchServicesServiceMock.findBranchServicePriceHistory,
            ).toHaveBeenCalledTimes(1);
            expect(
                branchServicesServiceMock.findBranchServicePriceHistory,
            ).toHaveBeenCalledWith(branchId, branchServiceId);
        });
    });
});