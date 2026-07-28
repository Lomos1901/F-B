import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator'; // Decorator cho các API công khai

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Tái cấu trúc: API này dành cho khách hàng, không cần đăng nhập.
   * Sử dụng decorator @Public() để bỏ qua JwtAuthGuard.
   */
  @Public()
  @Post('create-for-customer')
  @HttpCode(HttpStatus.CREATED)
  createOrderForCustomer(@Body() createOrderDto: CreateOrderDto) {
    // Không có thông tin người dùng cho đơn hàng của khách
    return this.ordersService.create(createOrderDto);
  }

  /**
   * Tái cấu trúc: API lấy danh sách đơn hàng theo tên trạng thái.
   * Dùng cho KDS, POS.
   */
  @Get('status/:statusName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.BARISTA, UserRole.CASHIER)
  getOrdersByStatus(@Param('statusName') statusName: string) {
    return this.ordersService.getOrdersByStatus(statusName);
  }

  /**
   * Tái cấu trúc: API lấy đơn hàng đang mở của một bàn cụ thể.
   * Dùng cho POS.
   */
  @Get('table/:tableNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER)
  getOpenOrderByTable(@Param('tableNumber') tableNumber: string) {
    return this.ordersService.getOpenOrderByTable(tableNumber);
  }

  /**
   * Tái cấu trúc: API cập nhật trạng thái của một đơn hàng.
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.BARISTA, UserRole.CASHIER)
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }
}
