import { Test, TestingModule } from "@nestjs/testing";
import { JwtStrategy, JwtPayload } from "./jwt.strategy";
import { PrismaService } from "../prisma/prisma.service";
import { UnauthorizedException } from "@nestjs/common";
import { Role } from "../../prisma/generated/client";

const mockPrismaService = { user: { findUnique: jest.fn() } };

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrismaService }
      ]
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  describe("validate", () => {
    it("should return the user object without the password if user is found", async () => {
      const payload: JwtPayload = {
        userId: 1,
        email: "test@example.com",
        username: "testuser"
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
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.userId }
      });
      expect(result).toEqual({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
      expect(result).not.toHaveProperty("password");
    });

    it("should throw UnauthorizedException if user is not found", async () => {
      const payload: JwtPayload = {
        userId: 1,
        email: "test@example.com",
        username: "testuser"
      };
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
