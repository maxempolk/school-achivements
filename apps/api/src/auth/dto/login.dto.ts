import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@test.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'password_test',
  })
  @MinLength(6)
  password!: string;
}
