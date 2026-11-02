import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';

import { AssignBranchServiceDto } from './dto/assign-branch-service.dto.js';
import { UpdateBranchServicePriceDto } from './dto/update-branch-service-price.dto.js';
import { UpdateBranchServiceStatusDto } from './dto/update-branch-service-status.dto.js';

import { BranchServicesService } from './branch-services.service.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BranchServicesController {
    constructor(
        private readonly branchServicesService: BranchServicesService,
    ) {}

    @Post('branches/:branchId/services')
    assignServiceToBranch(
        @Param('branchId', ParseUUIDPipe) branchId: string,
        @Body() assignBranchServiceDto: AssignBranchServiceDto,
    ) {
        return this.branchServicesService.assignServiceToBranch(
            branchId,
            assignBranchServiceDto,
        );
    }

    @Get('branches/:branchId/services')
    findBranchServices(
        @Param('branchId', ParseUUIDPipe) branchId: string,
    ) {
        return this.branchServicesService.findBranchServices(branchId);
    }

    @Get('services/:serviceId/branches')
    findServiceBranches(
        @Param('serviceId', ParseUUIDPipe) serviceId: string,
    ) {
        return this.branchServicesService.findServiceBranches(serviceId);
    }

    @Patch('branches/:branchId/services/:branchServiceId/status')
    updateBranchServiceStatus(
        @Param('branchId', ParseUUIDPipe) branchId: string,
        @Param('branchServiceId', ParseUUIDPipe) branchServiceId: string,
        @Body() updateBranchServiceStatusDto: UpdateBranchServiceStatusDto,
    ) {
        return this.branchServicesService.updateBranchServiceStatus(
            branchId,
            branchServiceId,
            updateBranchServiceStatusDto.isActive,
        );
    }

    @Patch('branches/:branchId/services/:branchServiceId/price')
    updateBranchServicePrice(
        @Param('branchId', ParseUUIDPipe) branchId: string,
        @Param('branchServiceId', ParseUUIDPipe) branchServiceId: string,
        @Body() updateBranchServicePriceDto: UpdateBranchServicePriceDto,
    ) {
        return this.branchServicesService.updateBranchServicePrice(
            branchId,
            branchServiceId,
            updateBranchServicePriceDto,
        );
    }

    @Get('branches/:branchId/services/:branchServiceId/prices')
    findBranchServicePriceHistory(
        @Param('branchId', ParseUUIDPipe) branchId: string,
        @Param('branchServiceId', ParseUUIDPipe) branchServiceId: string,
    ) {
        return this.branchServicesService.findBranchServicePriceHistory(
            branchId,
            branchServiceId,
        );
    }
}