// test/helpers/test-helpers.ts
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

export class TestHelper {
  public app: INestApplication;
  public prisma: PrismaService;
  private moduleRef: TestingModule;

  async initializeApp(): Promise<void> {
    this.moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    this.app = this.moduleRef.createNestApplication();
    this.prisma = this.app.get<PrismaService>(PrismaService);

    // Apply same configuration as main.ts
    this.app.enableCors();
    this.app.setGlobalPrefix("api/v1");

    await this.app.init();
  }

  async cleanDatabase(): Promise<void> {
    // Clean up database in correct order to handle foreign key constraints
    await this.prisma.vote.deleteMany();
    await this.prisma.quote.deleteMany();
    await this.prisma.user.deleteMany();
  }

  async closeApp(): Promise<void> {
    await this.cleanDatabase();
    await this.prisma.$disconnect();
    await this.app.close();
    await this.moduleRef.close();
  }

  // Helper methods for creating test data
  async createTestUser(userData = {}) {
    return request(this.app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ email: "test@example.com", username: "testuser", password: "password123", ...userData });
  }

  async loginTestUser(credentials = {}) {
    return request(this.app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "password123", ...credentials });
  }

  async createTestQuote(token: string, quoteData = {}) {
    return request(this.app.getHttpServer())
      .post("/api/v1/quotes")
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Test quote content", author: "Test Author", category: "Test", tags: ["test", "quote"], ...quoteData });
  }
}
