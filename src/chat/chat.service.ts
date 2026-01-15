import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async ensurePrivateAccess(userId: string, otherUserId: string) {
    // Only allow teacher-student pairs
    const pair = await this.prisma.teacherStudent.findFirst({
      where: {
        OR: [
          { teacherId: userId, studentId: otherUserId },
          { teacherId: otherUserId, studentId: userId },
        ],
      },
    });
    if (!pair) throw new ForbiddenException('Users are not assigned');
  }

  async getPrivateMessages(userId: string, otherUserId: string, page: number, limit: number) {
    await this.ensurePrivateAccess(userId, otherUserId);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.chatMessage.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chatMessage.count({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
      }),
    ]);
    return { items, total, page, limit };
  }

  async markPrivateRead(userId: string, otherUserId: string) {
    await this.ensurePrivateAccess(userId, otherUserId);
    await this.prisma.chatMessage.updateMany({
      where: { receiverId: userId, senderId: otherUserId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async getGroupMessages(userId: string, groupId: string, page: number, limit: number) {
    const member = await this.prisma.chatGroupMember.findFirst({ where: { groupId, userId } });
    if (!member) throw new ForbiddenException('Not a group member');
    const [items, total] = await this.prisma.$transaction([
      this.prisma.chatMessage.findMany({
        where: { groupId },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chatMessage.count({ where: { groupId } }),
    ]);
    return { items, total, page, limit };
  }

  async markGroupRead(userId: string, groupId: string) {
    const member = await this.prisma.chatGroupMember.findFirst({ where: { groupId, userId } });
    if (!member) throw new ForbiddenException('Not a group member');
    await this.prisma.chatMessage.updateMany({ where: { groupId, readAt: null }, data: { readAt: new Date() } });
    return { success: true };
  }

  async sendPrivateMessage(senderId: string, receiverId: string, content: string) {
    if (!content?.trim()) throw new BadRequestException('Empty content');
    await this.ensurePrivateAccess(senderId, receiverId);
    return this.prisma.chatMessage.create({ data: { senderId, receiverId, content } });
  }

  async sendGroupMessage(senderId: string, groupId: string, content: string) {
    if (!content?.trim()) throw new BadRequestException('Empty content');
    const member = await this.prisma.chatGroupMember.findFirst({ where: { groupId, userId: senderId } });
    if (!member) throw new ForbiddenException('Not a group member');
    return this.prisma.chatMessage.create({ data: { senderId, groupId, content } });
  }

  async createGroup(ownerId: string, name: string) {
    if (!name?.trim()) throw new BadRequestException('Invalid name');
    const exists = await this.prisma.chatGroup.findFirst({ where: { ownerId, name } });
    if (exists) throw new BadRequestException('Group name already exists for this teacher');
    return this.prisma.chatGroup.create({ data: { ownerId, name } });
  }

  async addMember(ownerId: string, groupId: string, userId: string) {
    const group = await this.prisma.chatGroup.findFirst({ where: { id: groupId, ownerId } });
    if (!group) throw new ForbiddenException('Not group owner');

    // Only allow adding students assigned to this teacher (owner)
    const [user, assignment] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } }),
      this.prisma.teacherStudent.findFirst({ where: { teacherId: ownerId, studentId: userId } }),
    ]);
    if (!user) throw new BadRequestException('User not found');
    if (user.role !== 'STUDENT') throw new ForbiddenException('Only students can be added');
    if (!assignment) throw new ForbiddenException('Student is not assigned to this teacher');
    const existingMember = await this.prisma.chatGroupMember.findFirst({ where: { groupId, userId } });
    if (existingMember) throw new BadRequestException('Student is already in the group');
    return this.prisma.chatGroupMember.create({ data: { groupId, userId } });
  }

  async removeMember(ownerId: string, groupId: string, userId: string) {
    const group = await this.prisma.chatGroup.findFirst({ where: { id: groupId, ownerId } });
    if (!group) throw new ForbiddenException('Not group owner');
    await this.prisma.chatGroupMember.deleteMany({ where: { groupId, userId } });
    return { success: true };
  }
}
