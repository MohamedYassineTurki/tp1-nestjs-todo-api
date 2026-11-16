import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { Role } from '../user/enums/role.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Jwt } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService : JwtService
  ) {}

  async register({ username, email, password }: RegisterDto) {
    const exists = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });
    if (exists) {
      throw new ConflictException('Username ou email déjà utilisé');
    }

    const salt = await bcrypt.genSalt();
    const user = this.userRepository.create({
      username,
      email,
      password: await bcrypt.hash(password, salt),
      role: Role.USER,
    });
    await this.userRepository.save(user);

    return this.toSafeUser(user);
  }

  async login({ username, password }: LoginDto) {
     const user = await this.userRepository
                  .createQueryBuilder('user')
                  .addSelect('user.password')
                  .where('user.username = :username', { username })
                  .getOne();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const payload = {
      username , 
      email : user.email , 
      role : user.role
    }
    const jwt = await this.jwtService.sign(payload) ; 

    return { message: 'Connexion réussie', user: this.toSafeUser(user) , "access-token" : jwt};
  }

  // ne jamais renvoyer le hash du mot de passe
  private toSafeUser({ id, username, email, role }: User) {
    return { id, username, email, role };
  }
}