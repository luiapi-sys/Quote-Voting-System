import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CreateUserDto, LoginDto } from "./dto/create-user.dto";

const mockAuthService = { register: jest.fn(), login: jest.fn() };

describe("AuthController", () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }]
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("register", () => {
    it("should register a new user and return user data and a token", async () => {
      const createUserDto: CreateUserDto = {
        username: "testuser",
        email: "test@example.com",
        password: "password123"
      };
      const result = {
        user: {
          id: 1,
          username: "testuser",
          email: "test@example.com",
          role: "USER"
        },
        token: "some.jwt.token"
      };
      mockAuthService.register.mockResolvedValue(result);

      expect(await controller.register(createUserDto)).toBe(result);
      expect(service.register).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe("login", () => {
    it("should log in a user and return user data and a token", async () => {
      const loginDto: LoginDto = {
        username: "testuser",
        password: "password123"
      };
      const result = {
        user: {
          id: 1,
          username: "testuser",
          email: "test@example.com",
          role: "USER"
        },
        token: "some.jwt.token"
      };
      mockAuthService.login.mockResolvedValue(result);

      expect(await controller.login(loginDto)).toBe(result);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
