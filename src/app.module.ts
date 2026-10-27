import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ServicesModule } from './services/services.module.js';
import { ServiceCategoriesModule } from './service-categories/service-categories.module.js';
import { PetsModule } from './pets/pets.module.js';

@Module({
  imports: [UsersModule, PrismaModule, AuthModule, ServicesModule, ServiceCategoriesModule, PetsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
  