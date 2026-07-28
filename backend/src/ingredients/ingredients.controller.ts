// backend/src/ingredients/ingredients.controller.ts

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
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { ImportStockDto, StocktakeDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('ingredients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Body() createIngredientDto: CreateIngredientDto) {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findAll() {
    return this.ingredientsService.findAll();
  }

  @Get('archived')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  findArchived() {
    return this.ingredientsService.findArchived();
  }

  @Get(':id/check-usage')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  checkUsage(@Param('id', ParseUUIDPipe) id: string) {
    return this.ingredientsService.checkDependencies(id);
  }

  /**
   * Tái cấu trúc: Endpoint nhập hàng.
   * Logic đã được chuyển vào service, controller không cần thay đổi nhiều.
   */
  @Post(':id/import')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  importStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() importStockDto: ImportStockDto,
  ) {
    return this.ingredientsService.importStock(id, importStockDto);
  }

  /**
   * Tái cấu trúc: Endpoint kiểm kho.
   * Logic đã được chuyển vào service, controller không cần thay đổi nhiều.
   */
  @Post(':id/stocktake')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  stocktake(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() stocktakeDto: StocktakeDto,
  ) {
    return this.ingredientsService.stocktake(id, stocktakeDto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIngredientDto: UpdateIngredientDto,
  ) {
    return this.ingredientsService.updateMetadata(id, updateIngredientDto);
  }

  @Patch(':id/restore')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.ingredientsService.restore(id);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.ingredientsService.softDelete(id);
  }

  @Delete(':id/hard')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  hardDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.ingredientsService.hardDelete(id);
  }
}
