import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { UsersService } from '../users/users.service';
import { AssignSelfDto } from './dto/student.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Student')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
@Controller('student')
export class StudentController {
  constructor(private users: UsersService, private prisma: PrismaService) {}

  @Post('assign-teacher')
  async assignTeacher(@Req() req: any, @Body() dto: AssignSelfDto) {
    const studentId = req.user.userId as string;
    return this.users.assignStudent(dto.teacherId, studentId);
  }

  @Get('teacher')
  async myTeacher(@Req() req: any) {
    const studentId = req.user.userId as string;
    const relation = await this.prisma.teacherStudent.findFirst({ where: { studentId } });
    if (!relation) return { teacher: null };
    const teacher = await this.prisma.user.findFirst({ where: { id: relation.teacherId, deletedAt: null } });
    return { teacher };
  }

  @Get('groups')
  async myGroups(@Req() req: any) {
    const userId = req.user.userId as string;
    const memberships = await this.prisma.chatGroupMember.findMany({ where: { userId }, include: { group: true } });
    return memberships.map((m: { group: any }) => m.group);
  }
}
