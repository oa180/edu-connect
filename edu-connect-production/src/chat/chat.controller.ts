import { Controller, Get, Param, Query, Req, UseGuards, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PaginationDto } from '../common/pagination.dto';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chat: ChatService) {}

  @Get('private/:userId')
  async privateHistory(@Req() req: any, @Param('userId') otherUserId: string, @Query() q: PaginationDto) {
    const userId = req.user.userId;
    return this.chat.getPrivateMessages(userId, otherUserId, q.page ?? 1, q.limit ?? 20);
  }

  @Post('private/:userId/read')
  async privateRead(@Req() req: any, @Param('userId') otherUserId: string) {
    const userId = req.user.userId;
    return this.chat.markPrivateRead(userId, otherUserId);
  }

  @Get('group/:groupId')
  async groupHistory(@Req() req: any, @Param('groupId') groupId: string, @Query() q: PaginationDto) {
    const userId = req.user.userId;
    return this.chat.getGroupMessages(userId, groupId, q.page ?? 1, q.limit ?? 20);
  }

  @Post('group/:groupId/read')
  async groupRead(@Req() req: any, @Param('groupId') groupId: string) {
    const userId = req.user.userId;
    return this.chat.markGroupRead(userId, groupId);
  }
}
