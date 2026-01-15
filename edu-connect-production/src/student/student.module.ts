import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [StudentController],
})
export class StudentModule {}
