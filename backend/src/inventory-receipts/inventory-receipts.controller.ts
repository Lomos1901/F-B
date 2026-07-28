// backend/src/inventory-receipts/inventory-receipts.controller.ts

import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { InventoryReceiptsService } from './inventory-receipts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('inventory-receipts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER) // Chỉ quản lý mới được xem lịch sử kho
export class InventoryReceiptsController {
  constructor(
    private readonly inventoryReceiptsService: InventoryReceiptsService,
  ) {}

  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
  ) {
    return this.inventoryReceiptsService.findAllWithDetails(startDate, endDate, type);
  }
}
