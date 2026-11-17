import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';

@Module({
    imports: [PrismaModule, AppJwtModule],
    controllers: [BranchesController],
    providers: [BranchesService, JwtAuthGuard],
})
export class BranchesModule {}