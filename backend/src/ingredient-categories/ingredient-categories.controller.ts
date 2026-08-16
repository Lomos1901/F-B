// backend/src/ingredient-categories/ingredient-categories.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IngredientCategoriesService } from './ingredient-categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

import { IsString, IsNotEmpty } from 'class-validator';

// DTO đơn giản để xác thực body
class IngredientCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

@Controller('ingredient-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER) // Chỉ quản lý mới được truy cập module này
export class IngredientCategoriesController {
  constructor(
    private readonly ingredientCategoriesService: IngredientCategoriesService,
  ) {}

  @Post()
  create(@Body() dto: IngredientCategoryDto) {
    return this.ingredientCategoriesService.create(dto.name);
  }

  @Get()
  findAll() {
    return this.ingredientCategoriesService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IngredientCategoryDto,
  ) {
    return this.ingredientCategoriesService.update(id, dto.name);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ingredientCategoriesService.remove(id);
  }
}
