import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
