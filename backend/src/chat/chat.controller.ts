import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() dto: ChatMessageDto, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id || 'unknown';
    return this.chatService.chat(userId, dto.message, dto.history || []);
  }
}
