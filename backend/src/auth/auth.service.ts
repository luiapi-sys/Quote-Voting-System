/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  UnauthorizedException,
  ConflictException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { CreateUserDto, LoginDto } from "./dto/create-user.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { username, email, password } = createUserDto;
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (existingUser) {
      throw new ConflictException("Username or email already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { username, email, password: hashedPassword }
    });
    // Generate token
    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      username: user.username
    });
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({ where: { username } });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate token
    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      username: user.username
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}
