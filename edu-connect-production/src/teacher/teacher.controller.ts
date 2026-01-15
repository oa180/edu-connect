import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { PaginationDto } from '../common/pagination.dto';
import { UsersService } from '../users/users.service';
import { ChatService } from '../chat/chat.service';
import { TeacherService } from './teacher.service';
import { CreateGroupDto, GroupMemberDto } from './dto/teacher.dto';

@ApiTags('Teacher')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
@Controller('teacher')
export class TeacherController {
  constructor(private users: UsersService, private chat: ChatService, private teacher: TeacherService) {}

  @Get('students')
  async myStudents(@Req() req: any, @Query() q: PaginationDto) {
    const teacherId = req.user?.userId;
    return this.users.teacherStudents(teacherId, q.page ?? 1, q.limit ?? 20);
  }

  @Post('groups')
  async createGroup(@Req() req: any, @Body() dto: CreateGroupDto) {
    const teacherId = req.user?.userId;
    return this.chat.createGroup(teacherId, dto.name);
  }

  @Get('groups')
  async myGroups(@Req() req: any) {
    const teacherId = req.user?.userId;
    return this.teacher.groupsByTeacher(teacherId);
  }

  @Post('groups/:id/add-student')
  async addStudentToGroup(@Req() req: any, @Param('id') groupId: string, @Body() dto: GroupMemberDto) {
    const teacherId = req.user?.userId;
    return this.chat.addMember(teacherId, groupId, dto.studentId);
  }

  @Delete('groups/:id/remove-student')
  async removeStudentFromGroup(@Req() req: any, @Param('id') groupId: string, @Body() dto: GroupMemberDto) {
    const teacherId = req.user?.userId;
    return this.chat.removeMember(teacherId, groupId, dto.studentId);
  }
}
