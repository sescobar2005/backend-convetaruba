import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';

@Module({
  imports: [PrismaModule, AppJwtModule],
  controllers: [ServicesController],
  providers: [ServicesService, JwtAuthGuard, RolesGuard]
})
export class ServicesModule {}
