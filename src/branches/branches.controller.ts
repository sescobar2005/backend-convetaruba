
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

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

import { BranchesService } from './branches.service.js';

import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { UpdateBranchStatusDto } from './dto/update-branch-status.dto.js';
import { Role } from '../../generated/prisma/enums.js';

interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        role: Role;
        tokenVersion: number;
    };
}

@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
    constructor(
        private readonly branchesService: BranchesService,
    ) {}

    private authorizeAdmin(request: AuthenticatedRequest): void {
        if (request.user.role !== 'ADMIN') {
            throw new ForbiddenException(
                'Only administrators can manage branches',
            );
        }
    }

    @Post()
    async createBranch(
        @Req() request: AuthenticatedRequest,
        @Body() createBranchDto: CreateBranchDto,
    ) {
        this.authorizeAdmin(request);

        return await this.branchesService.createBranch(createBranchDto);
    }

    @Get()
    async findAllBranches(
        @Req() request: AuthenticatedRequest,
    ) {
        this.authorizeAdmin(request);

        return await this.branchesService.findAllBranches();
    }

    @Get(':idBranch')
    async findBranchById(
        @Req() request: AuthenticatedRequest,
        @Param('idBranch', ParseUUIDPipe) idBranch: string,
    ) {
        this.authorizeAdmin(request);

        return await this.branchesService.findBranchById(idBranch);
    }

    @Patch(':idBranch')
    async updateBranch(
        @Req() request: AuthenticatedRequest,
        @Param('idBranch', ParseUUIDPipe) idBranch: string,
        @Body() updateBranchDto: UpdateBranchDto,
    ) {
        this.authorizeAdmin(request);

        return await this.branchesService.updateBranch(
            idBranch,
            updateBranchDto,
        );
    }

    @Patch(':idBranch/status')
    async updateBranchStatus(
        @Req() request: AuthenticatedRequest,
        @Param('idBranch', ParseUUIDPipe) idBranch: string,
        @Body() updateBranchStatusDto: UpdateBranchStatusDto,
    ) {
        this.authorizeAdmin(request);

        return await this.branchesService.updateBranchStatus(
            idBranch,
            updateBranchStatusDto.isActive,
        );
    }
}