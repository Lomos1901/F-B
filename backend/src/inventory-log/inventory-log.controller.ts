import { Controller, Get } from '@nestjs/common';
import { InventoryLogService } from './inventory-log.service';

@Controller('inventory-log')
export class InventoryLogController {
  constructor(private readonly inventoryLogService: InventoryLogService) {}

  @Get('all-with-ingredients')
  async getAllLogs() {
    return this.inventoryLogService.findAllWithIngredients();
  }
}
