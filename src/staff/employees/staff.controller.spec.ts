import { ForbiddenException } from '@nestjs/common';

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { CreateStaffDto } from './dto/create-staff.dto.js';
import { StaffController } from './staff.controller.js';
import { StaffService } from './staff.service.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto.js';
import { Role, StaffPosition } from '../../../generated/prisma/enums.js';

describe('StaffController', () => {
    let controller: StaffController;

    const staffId = '660e8400-e29b-41d4-a716-446655440000';
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    const createStaffDto: CreateStaffDto = {
        userId,
        staffNumber: 'EMP-001',
        position: StaffPosition.VETERINARIAN,
        specialty: 'Small animals',
    };

    const updateStaffDto: UpdateStaffDto = {
        position: StaffPosition.ASSISTANT,
        specialty: 'General assistance',
    };

    const updateStaffStatusDto: UpdateStaffStatusDto = {
        isActive: false,
    };

    const staffServiceMock = {
        createStaff: vi.fn(),
        findAllStaff: vi.fn(),
        findStaffById: vi.fn(),
        updateStaff: vi.fn(),
        updateStaffStatus: vi.fn(),
    };

    const createRequest = (
        role: Role,
    ): Parameters<StaffController['create']>[0] => ({
        user: {
            sub: userId,
            role,
            tokenVersion: 0,
        },
    } as Parameters<StaffController['create']>[0]);

    const adminRequest = () => createRequest(Role.ADMIN);

    beforeEach(() => {
        vi.clearAllMocks();

        controller = new StaffController(
            staffServiceMock as unknown as StaffService,
        );
    });

    describe('create', () => {
        it('should create a staff member when the requester is an ADMIN', async () => {
            const createdStaff = {
                idStaff: staffId,
                ...createStaffDto,
                isActive: true,
            };

            staffServiceMock.createStaff.mockResolvedValue(createdStaff);

            const result = await controller.create(
                adminRequest(),
                createStaffDto,
            );

            expect(result).toEqual(createdStaff);

            expect(staffServiceMock.createStaff).toHaveBeenCalledWith(
                createStaffDto,
            );
        });

        it('should throw ForbiddenException when the requester is not an ADMIN', () => {
            expect(() =>
                controller.create(
                    createRequest(Role.STAFF),
                    createStaffDto,
                ),
            ).toThrow(ForbiddenException);

            expect(staffServiceMock.createStaff).not.toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return all staff members when the requester is an ADMIN', async () => {
            const staffMembers = [
                {
                    idStaff: staffId,
                    userId,
                    staffNumber: 'EMP-001',
                    position: StaffPosition.VETERINARIAN,
                    specialty: 'Small animals',
                    isActive: true,
                },
            ];

            staffServiceMock.findAllStaff.mockResolvedValue(staffMembers);

            const result = await controller.findAll(adminRequest());

            expect(result).toEqual(staffMembers);

            expect(staffServiceMock.findAllStaff).toHaveBeenCalledTimes(1);
        });

        it('should throw ForbiddenException when the requester is a CUSTOMER', () => {
            expect(() =>
                controller.findAll(createRequest(Role.CUSTOMER)),
            ).toThrow(ForbiddenException);

            expect(staffServiceMock.findAllStaff).not.toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should return a staff member by ID when the requester is an ADMIN', async () => {
            const staffMember = {
                idStaff: staffId,
                userId,
                staffNumber: 'EMP-001',
                position: StaffPosition.VETERINARIAN,
                specialty: 'Small animals',
                isActive: true,
            };

            staffServiceMock.findStaffById.mockResolvedValue(staffMember);

            const result = await controller.findById(
                adminRequest(),
                staffId,
            );

            expect(result).toEqual(staffMember);

            expect(staffServiceMock.findStaffById).toHaveBeenCalledWith(
                staffId,
            );
        });

        it('should throw ForbiddenException when the requester is not an ADMIN', () => {
            expect(() =>
                controller.findById(
                    createRequest(Role.STAFF),
                    staffId,
                ),
            ).toThrow(ForbiddenException);

            expect(staffServiceMock.findStaffById).not.toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update a staff member when the requester is an ADMIN', async () => {
            const updatedStaff = {
                idStaff: staffId,
                userId,
                staffNumber: 'EMP-001',
                position: StaffPosition.ASSISTANT,
                specialty: 'General assistance',
                isActive: true,
            };

            staffServiceMock.updateStaff.mockResolvedValue(updatedStaff);

            const result = await controller.update(
                adminRequest(),
                staffId,
                updateStaffDto,
            );

            expect(result).toEqual(updatedStaff);

            expect(staffServiceMock.updateStaff).toHaveBeenCalledWith(
                staffId,
                updateStaffDto,
            );
        });

        it('should throw ForbiddenException when the requester is not an ADMIN', () => {
            expect(() =>
                controller.update(
                    createRequest(Role.CUSTOMER),
                    staffId,
                    updateStaffDto,
                ),
            ).toThrow(ForbiddenException);

            expect(staffServiceMock.updateStaff).not.toHaveBeenCalled();
        });
    });

    describe('updateStatus', () => {
        it('should update the staff status when the requester is an ADMIN', async () => {
            const updatedStaff = {
                idStaff: staffId,
                userId,
                staffNumber: 'EMP-001',
                position: StaffPosition.VETERINARIAN,
                specialty: 'Small animals',
                isActive: false,
                updatedAt: new Date('2026-02-01T10:00:00.000Z'),
            };

            staffServiceMock.updateStaffStatus.mockResolvedValue(updatedStaff);

            const result = await controller.updateStatus(
                adminRequest(),
                staffId,
                updateStaffStatusDto,
            );

            expect(result).toEqual(updatedStaff);

            expect(
                staffServiceMock.updateStaffStatus,
            ).toHaveBeenCalledWith(
                staffId,
                updateStaffStatusDto,
            );
        });

        it('should throw ForbiddenException when the requester is not an ADMIN', () => {
            expect(() =>
                controller.updateStatus(
                    createRequest(Role.STAFF),
                    staffId,
                    updateStaffStatusDto,
                ),
            ).toThrow(ForbiddenException);

            expect(
                staffServiceMock.updateStaffStatus,
            ).not.toHaveBeenCalled();
        });
    });
});