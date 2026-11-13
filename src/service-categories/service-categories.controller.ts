import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ServiceCategoriesService } from './service-categories.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto.js';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto.js';
import { UpdateServiceCategoryStatusDto } from './dto/update-service-category-status.dto.js';

@Controller('service-categories')
export class ServiceCategoriesController {
    constructor(private readonly serviceCategoriesService: ServiceCategoriesService){}

    @Get()
    findActiveCategories(){
        return this.serviceCategoriesService.findActiveCategories();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    createCategory(@Body() createServiceCategoryDto: CreateServiceCategoryDto) {
        return this.serviceCategoriesService.createCategory(createServiceCategoryDto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    updateCategory(
        @Param('id', ParseUUIDPipe) idCategory: string,
        @Body() updateServiceCategoryDto: UpdateServiceCategoryDto) {
        return this.serviceCategoriesService.updateCategory(idCategory, updateServiceCategoryDto);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('STAFF', 'ADMIN')
    updateCategoryStatus(
        @Param('id', ParseUUIDPipe) idCategory: string,
        @Body() updateServiceCategoryStatusDto: UpdateServiceCategoryStatusDto,
    ) {
        return this.serviceCategoriesService.updateCategoryStatus(
            idCategory,
            updateServiceCategoryStatusDto,
        );
    }
}