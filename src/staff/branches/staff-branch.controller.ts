import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import {
    Role,
} from '../../../generated/prisma/client.js';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';

import { AssignStaffBranchDto } from './dto/assign-staff-branch.dto.js';
import { EndStaffBranchDto } from './dto/end-staff-branch.dto.js';
import { StaffBranchService } from './staff-branch.service.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class StaffBranchController {
    constructor(
        private readonly staffBranchService: StaffBranchService,
    ) {}

    @Post('staff/:staffId/branches')
    async assignStaffToBranch(
        @Req() request: { user: { role: Role } },
        @Param('staffId', ParseUUIDPipe) staffId: string,
        @Body() assignStaffBranchDto: AssignStaffBranchDto,
    ) {
        this.authorizeAdmin(request);

        return this.staffBranchService.assignStaffToBranch(
            staffId,
            assignStaffBranchDto,
        );
    }

    @Get('staff/:staffId/branches')
    async findStaffBranches(
        @Req() request: { user: { role: Role } },
        @Param('staffId', ParseUUIDPipe) staffId: string,
    ) {
        this.authorizeAdmin(request);

        return this.staffBranchService.findStaffBranches(staffId);
    }

    @Get('branches/:branchId/staff')
    async findBranchStaff(
        @Req() request: { user: { role: Role } },
        @Param('branchId', ParseUUIDPipe) branchId: string,
    ) {
        this.authorizeAdmin(request);

        return this.staffBranchService.findBranchStaff(branchId);
    }

    @Patch('staff/:staffId/branches/:idStaffBranch/end')
    async endStaffBranchAssignment(
        @Req() request: { user: { role: Role } },
        @Param('staffId', ParseUUIDPipe) staffId: string,
        @Param('idStaffBranch', ParseUUIDPipe) idStaffBranch: string,
        @Body() endStaffBranchDto: EndStaffBranchDto,
    ) {
        this.authorizeAdmin(request);

        return this.staffBranchService.endStaffBranchAssignment(
            staffId,
            idStaffBranch,
            endStaffBranchDto,
        );
    }

    private authorizeAdmin(
        request: { user: { role: Role } },
    ): void {
        if (request.user.role !== Role.ADMIN) {
            throw new ForbiddenException(
                'Only administrators can manage staff branch assignments',
            );
        }
    }
}