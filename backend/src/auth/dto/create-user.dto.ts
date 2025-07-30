import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "johndoe" })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: "strongPassword123" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class CreateUserDto extends LoginDto {
  @ApiProperty({ example: "johndoe@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
