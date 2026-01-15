import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendPrivateMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class SendGroupMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;
}
