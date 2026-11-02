import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';

@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService){}

    @Get()
    findPublishedServices(){
        return this.servicesService.findPublishedServices();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    createService(@Body() createServiceDto: CreateServiceDto) {
        return this.servicesService.createService(createServiceDto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    updateService(
        @Param('id', ParseUUIDPipe) idService: string,
        @Body() updateServiceDto: UpdateServiceDto) {
        return this.servicesService.updateService(idService, updateServiceDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    deactivateService(
        @Param('id', ParseUUIDPipe) idService: string) {
        return this.servicesService.deactivateService(idService);
    }

}
