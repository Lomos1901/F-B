import { Controller, Get, Post, Body, UseGuards, Request, Headers, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('methods')
  async getPaymentMethods() {
    return this.paymentsService.getPaymentMethods();
  }

  @Public()
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

  @Public()
  @Post('sepay-webhook')
  async sepayWebhook(
    @Body(new ValidationPipe({ transform: false, whitelist: false, forbidNonWhitelisted: false })) body: any
  ) {
    // TODO: Sau khi test xong, nên bật lại xác thực API Key để bảo mật
    if (body.transferType === 'in') {
      const match = body.content?.match(/DH\s*([a-zA-Z0-9-]+)/i);
      if (match) {
        const orderId = match[1];
        await this.paymentsService.handleSepayWebhook(orderId, body.transferAmount, body.id.toString());
      }
    }

    return { success: true };
  }
}
