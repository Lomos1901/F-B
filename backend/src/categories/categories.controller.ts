import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAll() {
    return this.categoriesService.getAll();
  }

  @Post()
  async create(
    @Body('name') name: string,
    @Body('description') description?: string,
  ) {
    return this.categoriesService.create(name, description);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}