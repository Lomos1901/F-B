import { Controller, Get, Post, Patch, Param, ParseUUIDPipe, Query, UseGuards, DefaultValuePipe, ParseIntPipe, ParseBoolPipe } from '@nestjs/common';
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

  /**
   * API để lấy danh sách các cảnh báo, có hỗ trợ limit và lọc theo trạng thái chưa đọc.
   */
  @Get('anomalies')
  getAnomalies(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    // SỬA LỖI: Thêm Query để nhận tham số 'unread'
    @Query('unread', new DefaultValuePipe(false), ParseBoolPipe) unreadOnly: boolean,
  ) {
    return this.analyticsService.getAnomalies(limit, unreadOnly);
  }

  @Patch('anomalies/:id/read')
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.analyticsService.markAsRead(id);
  }

  @Post('run-analysis')
  runDailyAnalysis() {
    this.analyticsService.runDailyAnalysis();
    return { message: 'Đã kích hoạt quy trình phân tích dữ liệu. Kết quả sẽ được ghi nhận vào hệ thống.' };
  }
}