import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';
import { StaffController } from './employees/staff.controller.js';
import { StaffService } from './employees/staff.service.js';
import { StaffBranchService } from './branches/staff-branch.service.js';
import { StaffBranchController } from './branches/staff-branch.controller.js';

@Module({
  imports: [PrismaModule, AppJwtModule],
  controllers: [StaffController, StaffBranchController],
  providers: [StaffService, StaffBranchService],
})
export class StaffModule {}