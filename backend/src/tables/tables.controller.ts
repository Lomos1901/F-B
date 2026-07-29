import { Controller, Get, UseGuards } from '@nestjs/common';
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
}
