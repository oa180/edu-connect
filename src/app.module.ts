import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeacherModule } from './teacher/teacher.module';
import { ChatModule } from './chat/chat.module';
import { StudentModule } from './student/student.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, TeacherModule, ChatModule, StudentModule],
})
export class AppModule {}
