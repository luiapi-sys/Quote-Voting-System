import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { CreateUserDto, LoginDto } from "./dto/create-user.dto";
import { Role } from "../../prisma/generated/client";

// Mock bcrypt
jest.mock("bcrypt", () => ({ hash: jest.fn(), compare: jest.fn() }));

const mockPrismaService = {
  user: { findFirst: jest.fn(), create: jest.fn(), findUnique: jest.fn() }
};

const mockJwtService = { sign: jest.fn() };

describe("AuthService", () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    const createUserDto: CreateUserDto = {
      username: "newuser",
      email: "new@example.com",
      password: "password123"
    };

    it("should register a new user successfully", async () => {
      const hashedPassword = "hashedPassword";
      const createdUser = {
        id: 1,
        username: "newuser",
        email: "new@example.com",
        password: hashedPassword,
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const token = "some.jwt.token";

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.register(createUserDto);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: createUserDto.username },
            { email: createUserDto.email }
          ]
        }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: createUserDto.username,
          email: createUserDto.email,
          password: hashedPassword
        }
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: createdUser.id,
        email: createdUser.email,
        username: createdUser.username
      });

      const { password, ...userWithoutPassword } = createdUser;
      expect(result).toEqual({ user: userWithoutPassword, token });
    });

    it("should throw ConflictException if username or email already exists", async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 1 });

      await expect(service.register(createUserDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      username: "testuser",
      password: "password123"
    };
    const user = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      password: "hashedPassword",
      role: Role.USER,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it("should login a user and return a token", async () => {
      const token = "some.jwt.token";
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: loginDto.username }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
        username: user.username
      });

      const { password, ...userWithoutPassword } = user;
      expect(result).toEqual({ user: userWithoutPassword, token });
    });

    it("should throw UnauthorizedException if user is not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException if password is not valid", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
