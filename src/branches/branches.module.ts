import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';

import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';

@Module({
    imports: [PrismaModule, AppJwtModule],
    controllers: [BranchesController],
    providers: [BranchesService],
})
export class BranchesModule {}