import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ServicesModule } from './services/services.module.js';
import { ServiceCategoriesModule } from './service-categories/service-categories.module.js';
import { PetsModule } from './pets/pets.module.js';
import { StaffModule } from './staff/staff.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { MedicalRecordsModule } from './medical-records/medical-records.module.js';

@Module({
  imports: [UsersModule, PrismaModule, AuthModule, ServicesModule, ServiceCategoriesModule, PetsModule, StaffModule, BranchesModule, AppointmentsModule, NotificationsModule, MedicalRecordsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
  