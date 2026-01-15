import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AssignStudentDto, CreateUserDto, UpdateUserDto, ListUsersQueryDto } from './dto/admin.dto';
import { PaginationDto } from '../common/pagination.dto';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { AuthService } from '../auth/auth.service';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private users: UsersService, private auth: AuthService) {}

  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    const password = await this.auth.hashPassword(dto.password);
    return this.users.createUser({ name: dto.name, email: dto.email, password, role: dto.role });
  }

  @Get('users')
  async listUsers(@Query() q: ListUsersQueryDto) {
    return this.users.listUsers({ page: q.page ?? 1, limit: q.limit ?? 20, role: q.role });
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data: any = { ...dto };
    if (dto.password) data.password = await this.auth.hashPassword(dto.password);
    return this.users.updateUser(id, data);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.users.softDeleteUser(id);
  }

  @Post('assign-student')
  async assign(@Body() dto: AssignStudentDto) {
    return this.users.assignStudent(dto.teacherId, dto.studentId);
  }
}
