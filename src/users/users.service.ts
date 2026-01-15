import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/roles.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: { name: string; email: string; password: string; role: Role }) {
    return this.prisma.user.create({ data });
  }

  async listUsers(params: { page: number; limit: number; role?: Role }) {
    const where: any = { deletedAt: null };
    if (params.role) where.role = params.role;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async updateUser(id: string, data: Partial<{ name: string; email: string; password: string; role: Role }>) {
    const exists = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!exists) throw new NotFoundException('User not found');
    if (data.email) {
      const emailExists = await this.prisma.user.findFirst({ where: { email: data.email, id: { not: id } } });
      if (emailExists) throw new BadRequestException('Email already in use');
    }
    return this.prisma.user.update({ where: { id }, data });
  }

  async softDeleteUser(id: string) {
    const exists = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!exists) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async assignStudent(teacherId: string, studentId: string) {
    const [teacher, student] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: teacherId, role: Role.TEACHER, deletedAt: null } }),
      this.prisma.user.findFirst({ where: { id: studentId, role: Role.STUDENT, deletedAt: null } }),
    ]);
    if (!teacher) throw new BadRequestException('Invalid teacher');
    if (!student) throw new BadRequestException('Invalid student');
    return this.prisma.teacherStudent.upsert({
      where: { teacherId_studentId: { teacherId, studentId } },
      create: { teacherId, studentId },
      update: {},
    });
  }

  async teacherStudents(teacherId: string, page: number, limit: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: {
          deletedAt: null,
          learnedFrom: { some: { teacherId } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where: { deletedAt: null, learnedFrom: { some: { teacherId } } } }),
    ]);
    return { items, total, page, limit };
  }
}
