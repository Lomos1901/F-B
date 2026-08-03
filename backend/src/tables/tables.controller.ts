import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Public()
  @Get()
  async getTables() {
    return this.tablesService.getTables();
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getTableStatus() {
    return this.tablesService.getTableStatus();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTable(@Body() data: { name: string; zone: string; is_active?: boolean }) {
    return this.tablesService.createTable(data);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateTable(
    @Param('id') id: string,
    @Body() data: { name?: string; zone?: string; is_active?: boolean },
  ) {
    return this.tablesService.updateTable(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteTable(@Param('id') id: string) {
    return this.tablesService.deleteTable(id);
  }
}
