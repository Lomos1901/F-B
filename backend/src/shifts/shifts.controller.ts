import { Controller, Get, Post, Body, Req, UseGuards, Param, Patch, Query } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get('history')
  getHistory(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.shiftsService.getHistory(startDate, endDate);
  }

  @Get('current')
  getCurrentShift() {
    return this.shiftsService.getCurrentShift();
  }

  @Post('open')
  openShift(@Req() req, @Body() body: { starting_cash: number }) {
    return this.shiftsService.openShift(req.user.sub, body.starting_cash);
  }

  @Patch(':id/close')
  closeShift(@Param('id') id: string, @Req() req, @Body() body: { ending_cash: number, notes?: string }) {
    return this.shiftsService.closeShift(id, req.user.sub, body.ending_cash, body.notes);
  }
}
