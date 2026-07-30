import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('today-diagnostics')
  getTodayDiagnostics() {
    return this.analyticsService.getTodayDiagnostics();
  }

  /** Lấy dữ liệu chẩn đoán cho kho hàng. */
  @Get('inventory-diagnostics')
  getInventoryDiagnostics() {
    return this.analyticsService.getInventoryDiagnostics();
  }

  @Get('anomalies')
  getAnomalies(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('unread', new DefaultValuePipe(false), ParseBoolPipe)
    unreadOnly: boolean,
  ) {
    return this.analyticsService.getAnomalies(limit, unreadOnly);
  }

  @Post('generate-ai-report')
  async generateAiReport() {
    return this.analyticsService.generateAiReport();
  }

  @Patch('anomalies/:id/read')
  markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.analyticsService.markAsRead(id);
  }

  @Post('run-analysis')
  async runDailyAnalysis(
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
  ) {
    await this.analyticsService.runDailyAnalysis(force);
    return {
      message:
        'Đã kích hoạt quy trình phân tích dữ liệu. Kết quả sẽ được ghi nhận vào hệ thống.',
    };
  }
}
