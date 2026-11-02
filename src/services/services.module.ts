import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';

import { ServicesService } from './catalog/services.service.js';
import { ServicesController } from './catalog/services.controller.js';

import { BranchServicesService } from './branch-services/branch-services.service.js';
import { BranchServicesController } from './branch-services/branch-services.controller.js';

@Module({
    imports: [PrismaModule, AppJwtModule],
    controllers: [
        ServicesController,
        BranchServicesController,
    ],
    providers: [
        ServicesService,
        BranchServicesService,
        JwtAuthGuard,
        RolesGuard,
    ],
})
export class ServicesModule {}