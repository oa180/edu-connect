import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  async groupsByTeacher(teacherId: string) {
    return this.prisma.chatGroup.findMany({ where: { ownerId: teacherId } });
  }
}
