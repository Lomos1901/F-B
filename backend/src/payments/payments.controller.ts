import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('methods')
  async getPaymentMethods() {
    return this.paymentsService.getPaymentMethods();
  }

  @Get('bank-info')
  async getBankInfo() {
    return this.paymentsService.getBankInfo();
  }

  @Post('bank-info')
  async updateBankInfo(@Body() body: { bank_bin: string, account_number: string, account_name: string }) {
    return this.paymentsService.updateBankInfo(body);
  }

  @Post()
  async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    const cashierId = req.user?.sub; // ID của thu ngân (từ JWT)
    return this.paymentsService.createPayment(createPaymentDto, cashierId);
  }
}
