import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
//! propriete bien assigne mais pas par le constructeur, donc on peut utiliser "!" pour dire a TypeScript que la propriete sera assignee plus tard.