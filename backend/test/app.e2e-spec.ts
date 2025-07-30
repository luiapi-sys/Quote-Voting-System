import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { Role } from "../prisma/generated/client";

describe("Quote Vote System E2E Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data
  let userToken: string;
  let adminToken: string;
  let testUser: any;
  let adminUser: any;
  let testQuote: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    // Add the global prefix here to match main.ts
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Clean database once before all tests
    await prisma.vote.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.user.deleteMany();

    // Create a regular user and an admin user for all tests
    const userResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: "testuser@example.com",
        username: "testuser",
        password: "password123"
      });
    userToken = userResponse.body.token;
    testUser = userResponse.body.user;

    const adminResponse = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({
        email: "admin@example.com",
        username: "adminuser",
        password: "password123"
      });
    adminToken = adminResponse.body.token;
    adminUser = adminResponse.body.user;

    // Elevate the admin user's role directly in the DB
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: Role.ADMIN }
    });
    adminUser.role = Role.ADMIN;
  });

  // Clean quotes and votes before each test suite (describe block)
  beforeEach(async () => {
    await prisma.vote.deleteMany();
    await prisma.quote.deleteMany();
  });

  afterAll(async () => {
    // Clean up after all tests
    // await prisma.vote.deleteMany();
    // await prisma.quote.deleteMany();
    // await prisma.user.deleteMany();
    await app.close();
  });

  describe("Authentication (E2E)", () => {
    it("/auth/register (POST) - should register a new user successfully", async () => {
      const userData = {
        email: "new@example.com",
        username: "newuser",
        password: "password123"
      };
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("/auth/register (POST) - should fail to register with duplicate email", async () => {
      const userData = {
        email: "testuser@example.com", // Already exists from beforeAll
        username: "anotheruser",
        password: "password123"
      };
      await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(409); // Conflict
    });

    it("/auth/register (POST) - should fail with invalid data (validation)", async () => {
      const invalidData = {
        email: "not-an-email",
        username: "new",
        password: "short" // too short
      };
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send(invalidData)
        .expect(400); // Bad Request

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain("email must be an email");
      expect(response.body.message).toContain(
        "password must be longer than or equal to 8 characters"
      );
    });

    it("/auth/login (POST) - should login successfully with valid credentials", async () => {
      const loginData = { username: "testuser", password: "password123" };
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.username).toBe(loginData.username);
    });

    it("/auth/login (POST) - should fail with invalid password", async () => {
      const loginData = { username: "testuser", password: "wrongpassword" };
      await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(401); // Unauthorized
    });
  });

  describe("Quotes (E2E)", () => {
    it("/quotes (POST) - should create a quote successfully", async () => {
      const quoteData = {
        content: "A new quote for testing.",
        author: "E2E Test"
      };
      const response = await request(app.getHttpServer())
        .post("/api/v1/quotes")
        .set("Authorization", `Bearer ${userToken}`)
        .send(quoteData)
        .expect(201);

      expect(response.body.content).toBe(quoteData.content);
      expect(response.body.author).toBe(quoteData.author);
      expect(response.body.createdById).toBe(testUser.id);
      testQuote = response.body; // save for other tests
    });

    it("/quotes (POST) - should fail without authentication", async () => {
      const quoteData = { content: "This should fail.", author: "No Auth" };
      await request(app.getHttpServer())
        .post("/api/v1/quotes")
        .send(quoteData)
        .expect(401);
    });

    it("/quotes (GET) - should get a list of quotes", async () => {
      // Create a quote first
      await request(app.getHttpServer())
        .post("/api/v1/quotes")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ content: "Quote 1" });

      const response = await request(app.getHttpServer())
        .get("/api/v1/quotes")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("quotes");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.quotes).toBeInstanceOf(Array);
      expect(response.body.quotes.length).toBe(1);
      expect(response.body.quotes[0].content).toBe("Quote 1");
    });

    it("/quotes/:id (GET) - should get a single quote by ID", async () => {
      // Create a quote
      const createResponse = await request(app.getHttpServer())
        .post("/api/v1/quotes")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ content: "A specific quote" });
      const quoteId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/quotes/${quoteId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(quoteId);
      expect(response.body.content).toBe("A specific quote");
    });

    it("/quotes/:id (PATCH) - should update a quote successfully by owner", async () => {
      // Create a quote
      const createResponse = await request(app.getHttpServer())
        .post("/api/v1/quotes")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ content: "Original content" });
      const quoteId = createResponse.body.id;

      const updateData = { content: "Updated content" };
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/quotes/${quoteId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.content).toBe(updateData.content);
    });

    it("/quotes/:id (DELETE) - should soft delete a quote by owner", async () => {
      // Create a quote
      const createResponse = await request(app.getHttpServer())
        .post("/api/v1/quotes")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ content: "To be deleted" });
      const quoteId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/api/v1/quotes/${quoteId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200);

      // Verify it's gone from the public list (soft deleted)
      await request(app.getHttpServer())
        .get(`/api/v1/quotes/${quoteId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .expect(404);
    });

    it("/quotes/:id (DELETE) - should hard delete a quote by admin", async () => {
      // Create a quote with a regular user
      const createResponse = await request(app.getHttpServer())
        .post("/api/v1/quotes")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ content: "Admin will delete this" });
      const quoteId = createResponse.body.id;

      // Admin deletes it
      await request(app.getHttpServer())
        .delete(`/api/v1/quotes/${quoteId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Verify it's truly gone from the DB
      const deletedQuote = await prisma.quote.findUnique({
        where: { id: quoteId }
      });
      expect(deletedQuote).toBeNull();
    });
  });

  describe("Votes (E2E)", () => {
    let quoteToVoteOn: any;

    beforeEach(async () => {
      // Create a quote to be used in vote tests
      const response = await request(app.getHttpServer())
        .post("/api/v1/quotes")
        .set("Authorization", `Bearer ${userToken}`) // user creates the quote
        .send({ content: "A quote to vote on", author: "Voter Test" });
      quoteToVoteOn = response.body;
    });

    it("/votes/quote/:quoteId (POST) - should cast an upvote successfully", async () => {
      const quoteId = quoteToVoteOn.id;
      const voteData = { value: 1 };

      // The admin user (a different user) votes on the quote
      const response = await request(app.getHttpServer())
        .post(`/api/v1/votes/quote/${quoteId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(voteData)
        .expect(200); // OK

      expect(response.body.totalVotes).toBe(1);
      expect(response.body.id).toBe(quoteId);
    });

    it("/votes/quote/:quoteId (POST) - should fail if user already voted", async () => {
      const quoteId = quoteToVoteOn.id;
      const voteData = { value: 1 };

      // First vote
      await request(app.getHttpServer())
        .post(`/api/v1/votes/quote/${quoteId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(voteData)
        .expect(200);

      // Second vote (should fail)
      await request(app.getHttpServer())
        .post(`/api/v1/votes/quote/${quoteId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ value: 1 })
        .expect(409); // Conflict
    });

    it("/votes/quote/:quoteId (POST) - should fail for non-existent quote", async () => {
      const nonExistentQuoteId = 99999;
      await request(app.getHttpServer())
        .post(`/api/v1/votes/quote/${nonExistentQuoteId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ value: 1 })
        .expect(404); // Not Found
    });
  });
});
