import { Module } from '@nestjs/common';
import { StaffService } from './staff.service.js';
import { StaffController } from './staff.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';

@Module({
  imports: [PrismaModule, AppJwtModule],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}