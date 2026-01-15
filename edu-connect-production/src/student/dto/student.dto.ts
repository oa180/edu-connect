import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignSelfDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  teacherId!: string;
}
