import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash('AdminPass123!', 10);
  const teacherPass = await bcrypt.hash('TeacherPass123!', 10);
  const studentPass = await bcrypt.hash('StudentPass123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@example.com', password: adminPass, role: 'ADMIN' as any },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: { name: 'Teacher Tom', email: 'teacher@example.com', password: teacherPass, role: 'TEACHER' as any },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: { name: 'Student Sue', email: 'student@example.com', password: studentPass, role: 'STUDENT' as any },
  });

  await prisma.teacherStudent.upsert({
    where: { teacherId_studentId: { teacherId: teacher.id, studentId: student.id } },
    update: {},
    create: { teacherId: teacher.id, studentId: student.id },
  });

  const group = await prisma.chatGroup.upsert({
    where: { id: 'seed-group-1' },
    update: {},
    create: { id: 'seed-group-1', name: 'Algebra 101', ownerId: teacher.id },
  });

  await prisma.chatGroupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: teacher.id } },
    update: {},
    create: { groupId: group.id, userId: teacher.id },
  });
  await prisma.chatGroupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: student.id } },
    update: {},
    create: { groupId: group.id, userId: student.id },
  });

  await prisma.chatMessage.createMany({
    data: [
      { senderId: teacher.id, receiverId: student.id, content: 'Welcome to the class!' },
      { senderId: student.id, receiverId: teacher.id, content: 'Thank you!' },
      { senderId: teacher.id, groupId: group.id, content: 'Group chat opened.' },
    ],
    skipDuplicates: true,
  });

  // eslint-disable-next-line no-console
  console.log('Seed completed:', { admin: admin.email, teacher: teacher.email, student: student.email });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
