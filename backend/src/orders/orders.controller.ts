import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('create-for-customer')
  @HttpCode(HttpStatus.CREATED)
  createOrderForCustomer(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  // API mới cho POS để lấy các đơn hàng chờ thanh toán
  @Get('completed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  getCompletedOrders() {
    return this.ordersService.getOrdersByStatus('COMPLETED');
  }

  @Get('status/:status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.BARISTA, UserRole.CASHIER)
  getOrdersByStatus(@Param('status') status: string) {
    return this.ordersService.getOrdersByStatus(status);
  }

  @Get('table/:tableNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  getOpenOrderByTable(@Param('tableNumber') tableNumber: string) {
    return this.ordersService.getOpenOrderByTable(tableNumber);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.BARISTA, UserRole.CASHIER)
  updateStatus(@Param('id') id: string, @Body() updateOrderStatusDto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }
}
