import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { ImportStockDto, StocktakeDto } from './dto/transaction.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Giả định đã có

@Controller('ingredients')
@UseGuards(JwtAuthGuard, RolesGuard) // Áp dụng cho toàn bộ controller
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.BARISTA, UserRole.CASHIER)
  getAll() {
    return this.ingredientsService.findAll();
  }

  @Get('archived')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  getArchived() {
    return this.ingredientsService.findArchived();
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Body() createIngredientDto: CreateIngredientDto) {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Get(':id/check-usage')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  checkUsage(@Param('id') id: string) {
    return this.ingredientsService.checkDependencies(id);
  }

  @Post(':id/import')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  importStock(@Param('id') id: string, @Body() importStockDto: ImportStockDto) {
    return this.ingredientsService.importStock(id, importStockDto);
  }

  @Post(':id/stocktake')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  stocktake(@Param('id') id: string, @Body() stocktakeDto: StocktakeDto) {
    return this.ingredientsService.stocktake(id, stocktakeDto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  updateMetadata(@Param('id') id: string, @Body() updateIngredientDto: UpdateIngredientDto) {
    return this.ingredientsService.updateMetadata(id, updateIngredientDto);
  }

  @Patch(':id/restore')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  restore(@Param('id') id: string) {
    return this.ingredientsService.restore(id);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  remove(@Param('id') id: string) {
    return this.ingredientsService.softDelete(id);
  }

  @Delete(':id/hard')
  @Roles(UserRole.OWNER) // Chỉ chủ sở hữu mới có quyền xóa vĩnh viễn
  hardRemove(@Param('id') id: string) {
    return this.ingredientsService.hardDelete(id);
  }
}
