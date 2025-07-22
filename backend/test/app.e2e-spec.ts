// test/app.e2e-spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Quote Vote System E2E Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data
  let userToken: string;
  let adminToken: string;
  let testUser: any;
  let testQuote: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix("api/v1");
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  beforeEach(async () => {
    // Clean database before each test
    // await prisma.vote.deleteMany();
    // await prisma.quote.deleteMany();
    // await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Clean up after all tests
    // await prisma.vote.deleteMany();
    // await prisma.quote.deleteMany();
    // await prisma.user.deleteMany();
    await app.close();
  });

  // describe("Authentication (E2E)", () => {
  //   describe("/auth/register (POST)", () => {
  //     it("should register a new user successfully", async () => {
  //       const userData = { email: "test@example.com", username: "testuser", password: "password123" };
  //       const response = await request(app.getHttpServer()).post("/api/v1/auth/register").send(userData).expect(201);
  //       expect(response.body).toHaveProperty("user");
  //       expect(response.body).toHaveProperty("token");
  //       expect(response.body.user.email).toBe(userData.email);
  //       expect(response.body.user.username).toBe(userData.username);
  //       expect(response.body.user).not.toHaveProperty("password");
  //       // Store for later tests
  //       userToken = response.body.token;
  //       testUser = response.body.user;
  //     });

  //     it("should fail to register with duplicate email", async () => {
  //       const userData = { email: "test@example.com", username: "testuser", password: "password123" };

  //       // First registration
  //       await request(app.getHttpServer()).post("/api/v1/auth/register").send(userData).expect(201);

  //       // Duplicate registration
  //       await request(app.getHttpServer())
  //         .post("/api/v1/auth/register")
  //         .send({ ...userData, username: "differentuser" })
  //         .expect(409);
  //     });

  //     it("should fail to register with invalid data", async () => {
  //       const invalidData = {
  //         email: "invalid-email",
  //         username: "ab", // Too short
  //         password: "123" // Too short
  //       };

  //       await request(app.getHttpServer()).post("/api/v1/auth/register").send(invalidData).expect(400);
  //     });
  //   });

  //   describe("/auth/login (POST)", () => {
  //     beforeEach(async () => {
  //       // Create user for login tests
  //       await request(app.getHttpServer())
  //         .post("/api/v1/auth/register")
  //         .send({ email: "login@example.com", username: "loginuser", password: "password123" });
  //     });

  //     it("should login successfully with valid credentials", async () => {
  //       const response = await request(app.getHttpServer())
  //         .post("/api/v1/auth/login")
  //         .send({ email: "login@example.com", password: "password123" })
  //         .expect(200);

  //       expect(response.body).toHaveProperty("user");
  //       expect(response.body).toHaveProperty("token");
  //       expect(response.body.user.email).toBe("login@example.com");
  //     });

  //     it("should fail with invalid credentials", async () => {
  //       await request(app.getHttpServer()).post("/api/v1/auth/login").send({ email: "login@example.com", password: "wrongpassword" }).expect(401);
  //     });

  //     it("should fail with non-existent user", async () => {
  //       await request(app.getHttpServer()).post("/api/v1/auth/login").send({ email: "nonexistent@example.com", password: "password123" }).expect(401);
  //     });
  //   });
  // });

  describe("Quotes (E2E)", () => {
    beforeEach(async () => {
      // Setup user for quote tests
      const loginResponse = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email: "quote@example.com", password: "password123" });
      userToken = loginResponse.body.token;
      testUser = loginResponse.body.user;
      console.log("testUser login", testUser);
    });

    describe("/quotes (POST)", () => {
      it("should create a quote successfully with authentication", async () => {
        const quoteData = { content: "Life is beautiful", author: "Anonymous" };
        const response = await request(app.getHttpServer())
          .post("/api/v1/quotes")
          .set("Authorization", `Bearer ${userToken}`)
          .send(quoteData)
          .expect(201);

        expect(response.body.content).toBe(quoteData.content);
        expect(response.body.author).toBe(quoteData.author);
        expect(response.body.createdBy.id).toBe(testUser.id);
        testQuote = response.body;
      });

      it("should fail to create quote without authentication", async () => {
        const quoteData = { content: "Test quote", author: "Test Author" };
        await request(app.getHttpServer()).post("/api/v1/quotes").send(quoteData).expect(401);
      });
    });

    describe("/quotes (GET)", () => {
      beforeEach(async () => {
        // Create test quotes
        for (let i = 0; i < 5; i++) {
          await request(app.getHttpServer())
            .post("/api/v1/quotes")
            .set("Authorization", `Bearer ${userToken}`)
            .send({ content: `Test quote ${i + 1}`, author: `Author ${i + 1}` });
        }
      });

      it("should get all quotes with pagination", async () => {
        const response = await request(app.getHttpServer())
          .get("/api/v1/quotes?page=1&limit=3")
          .set("Authorization", `Bearer ${userToken}`)
          .expect(200);
        console.log(response.body);
        expect(response.body.quotes).toHaveLength(3);
        expect(response.body.pagination).toEqual({ page: 1, limit: 3, total: 5, pages: 2 });
      });

      it("should search quotes by content", async () => {
        const response = await request(app.getHttpServer())
          .get("/api/v1/quotes?search=quote 1")
          .set("Authorization", `Bearer ${userToken}`)
          .expect(200);
        expect(response.body.quotes).toHaveLength(1);
        expect(response.body.quotes[0].content).toContain("quote 1");
      });

      it("should sort quotes by totalVotes", async () => {
        const response = await request(app.getHttpServer())
          .get("/api/v1/quotes?sortBy=totalVotes&sortOrder=desc")
          .set("Authorization", `Bearer ${userToken}`)
          .expect(200);
        expect(response.body.quotes).toHaveLength(5);
        // All should have 0 votes initially, so just check structure
        expect(response.body.quotes[0]).toHaveProperty("totalVotes");
      });
    });

    describe("/quotes/:id (GET)", () => {
      beforeEach(async () => {
        const response = await request(app.getHttpServer())
          .post("/api/v1/quotes")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ content: "Single quote test", author: "Test Author" });
        testQuote = response.body;
      });

      it("should get a single quote by ID", async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/quotes/${testQuote.id}`)
          .set("Authorization", `Bearer ${userToken}`)
          .expect(200);
        expect(response.body.id).toBe(testQuote.id);
        expect(response.body.content).toBe("Single quote test");
        expect(response.body.votes).toEqual([]);
      });

      it("should return 404 for non-existent quote", async () => {
        const fakeId = "507f1f77bcf86cd799439011"; // Valid ObjectId format
        await request(app.getHttpServer()).get(`/api/v1/quotes/${fakeId}`).set("Authorization", `Bearer ${userToken}`).expect(404);
      });
    });

    describe("/quotes/:id (Patch)", () => {
      beforeEach(async () => {
        const registerResponse = await request(app.getHttpServer())
          .post("/api/v1/auth/register")
          .send({ email: "patchquote@example.com", username: "patchQuoteUser", password: "password123" });
        userToken = registerResponse.body.token;
        testUser = registerResponse.body.user;
        console.log("register", registerResponse.body);

        const response = await request(app.getHttpServer())
          .post("/api/v1/quotes")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ content: "Original content", author: "Original Author" });
        testQuote = response.body;
        console.log("testQuote", testQuote);
      });

      it("should update quote successfully when no votes exist", async () => {
        const updateData = { content: "Updated content", author: "Updated Author" };
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/quotes/${testQuote.id}`)
          .set("Authorization", `Bearer ${userToken}`)
          .send(updateData)
          .expect(200);
        expect(response.body.content).toBe("Updated content");
        expect(response.body.author).toBe("Updated Author");
        console.log("patch", response.body);
      });

      it("should fail to update quote without authentication", async () => {
        await request(app.getHttpServer()).patch(`/api/v1/quotes/${testQuote.id}`).send({ content: "Updated content" }).expect(401);
      });

      it("should fail to update another users quote", async () => {
        // Create another user
        const anotherUserResponse = await request(app.getHttpServer())
          .post("/api/v1/auth/register")
          .send({ email: "another@example.com", username: "anotheruser", password: "password123" });
        const anotherUserToken = anotherUserResponse.body.token;

        await request(app.getHttpServer())
          .patch(`/api/v1/quotes/${testQuote.id}`)
          .set("Authorization", `Bearer ${anotherUserToken}`)
          .send({ content: "Malicious update" })
          .expect(403);
      });
    });

    // describe("/quotes/:id (DELETE)", () => {
    //   beforeEach(async () => {
    //     const response = await request(app.getHttpServer())
    //       .post("/api/v1/quotes")
    //       .set("Authorization", `Bearer ${userToken}`)
    //       .send({ content: "Quote to delete", author: "Test Author" });

    //     testQuote = response.body;
    //   });

    //   it("should delete quote successfully", async () => {
    //     await request(app.getHttpServer()).delete(`/api/v1/quotes/${testQuote.id}`).set("Authorization", `Bearer ${userToken}`).expect(200);

    //     // Verify quote is deleted
    //     await request(app.getHttpServer()).get(`/api/v1/quotes/${testQuote.id}`).expect(404);
    //   });

    //   it("should fail to delete without authentication", async () => {
    //     await request(app.getHttpServer()).delete(`/api/v1/quotes/${testQuote.id}`).expect(401);
    //   });

    //   it("should fail to delete another users quote", async () => {
    //     // Create another user
    //     const anotherUserResponse = await request(app.getHttpServer())
    //       .post("/api/v1/auth/register")
    //       .send({ email: "another@example.com", username: "anotheruser", password: "password123" });

    //     const anotherUserToken = anotherUserResponse.body.token;

    //     await request(app.getHttpServer()).delete(`/api/v1/quotes/${testQuote.id}`).set("Authorization", `Bearer ${anotherUserToken}`).expect(403);
    //   });
    // });
  });

  describe("Votes (E2E)", () => {
    let secondUser: any;
    let secondUserToken: string;

    beforeEach(async () => {
      // Setup first user
      const user1Response = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({ email: "voter1@example.com", username: "voter1", password: "password123" });

      userToken = user1Response.body.token;
      testUser = user1Response.body.user;

      // Setup second user
      const user2Response = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({ email: "voter2@example.com", username: "voter2", password: "password123" });

      secondUserToken = user2Response.body.token;
      secondUser = user2Response.body.user;

      // Create test quote
      const quoteResponse = await request(app.getHttpServer())
        .post("/api/v1/quotes")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ content: "Quote for voting", author: "Test Author" });

      testQuote = quoteResponse.body;
    });

    describe("/votes (POST)", () => {
      it("should create upvote successfully", async () => {
        const response = await request(app.getHttpServer())
          .post("/api/v1/votes")
          .set("Authorization", `Bearer ${secondUserToken}`)
          .send({ quoteId: testQuote.id, value: 1 })
          .expect(201);

        expect(response.body.value).toBe(1);
        expect(response.body.quoteId).toBe(testQuote.id);
        expect(response.body.userId).toBe(secondUser.id);
      });

      it("should create downvote successfully", async () => {
        const response = await request(app.getHttpServer())
          .post("/api/v1/votes")
          .set("Authorization", `Bearer ${secondUserToken}`)
          .send({ quoteId: testQuote.id, value: -1 })
          .expect(201);

        expect(response.body.value).toBe(-1);
      });

      it("should fail to vote on same quote twice", async () => {
        // First vote
        await request(app.getHttpServer())
          .post("/api/v1/votes")
          .set("Authorization", `Bearer ${secondUserToken}`)
          .send({ quoteId: testQuote.id, value: 1 })
          .expect(201);

        // Second vote (should fail)
        await request(app.getHttpServer())
          .post("/api/v1/votes")
          .set("Authorization", `Bearer ${secondUserToken}`)
          .send({ quoteId: testQuote.id, value: -1 })
          .expect(409);
      });

      it("should fail to vote without authentication", async () => {
        await request(app.getHttpServer()).post("/api/v1/votes").send({ quoteId: testQuote.id, value: 1 }).expect(401);
      });

      it("should fail to vote with invalid value", async () => {
        await request(app.getHttpServer())
          .post("/api/v1/votes")
          .set("Authorization", `Bearer ${secondUserToken}`)
          .send({
            quoteId: testQuote.id,
            value: 5 // Invalid value
          })
          .expect(400);
      });
    });

    describe("/votes/:id (Patch)", () => {
      let testVote: any;

      beforeEach(async () => {
        const response = await request(app.getHttpServer())
          .post("/api/v1/votes")
          .set("Authorization", `Bearer ${secondUserToken}`)
          .send({ quoteId: testQuote.id, value: 1 });

        testVote = response.body;
      });

      it("should update vote successfully", async () => {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/votes/${testVote.id}`)
          .set("Authorization", `Bearer ${secondUserToken}`)
          .send({ value: -1 })
          .expect(200);

        expect(response.body.value).toBe(-1);
      });

      it("should fail to update another users vote", async () => {
        await request(app.getHttpServer())
          .patch(`/api/v1/votes/${testVote.id}`)
          .set("Authorization", `Bearer ${userToken}`)
          .send({ value: -1 })
          .expect(403);
      });
    });

    describe("/votes/:id (DELETE)", () => {
      let testVote: any;

      beforeEach(async () => {
        const response = await request(app.getHttpServer())
          .post("/api/v1/votes")
          .set("Authorization", `Bearer ${secondUserToken}`)
          .send({ quoteId: testQuote.id, value: 1 });

        testVote = response.body;
      });

      it("should delete vote successfully", async () => {
        await request(app.getHttpServer()).delete(`/api/v1/votes/${testVote.id}`).set("Authorization", `Bearer ${secondUserToken}`).expect(200);

        // Should be able to vote again after deletion
        await request(app.getHttpServer())
          .post("/api/v1/votes")
          .set("Authorization", `Bearer ${secondUserToken}`)
          .send({ quoteId: testQuote.id, value: 1 })
          .expect(201);
      });

      it("should fail to delete another users vote", async () => {
        await request(app.getHttpServer()).delete(`/api/v1/votes/${testVote.id}`).set("Authorization", `Bearer ${userToken}`).expect(403);
      });
    });
  });

  describe("Analytics (E2E)", () => {
    beforeEach(async () => {
      // Setup users and quotes with votes for analytics
      const user1Response = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({ email: "analytics1@example.com", username: "analytics1", password: "password123" });

      userToken = user1Response.body.token;

      const user2Response = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({ email: "analytics2@example.com", username: "analytics2", password: "password123" });

      const secondUserToken = user2Response.body.token;

      // Create quotes and votes for testing
      for (let i = 0; i < 3; i++) {
        const quoteResponse = await request(app.getHttpServer())
          .post("/api/v1/quotes")
          .set("Authorization", `Bearer ${userToken}`)
          .send({ content: `Analytics quote ${i + 1}`, category: i % 2 === 0 ? "Life" : "Wisdom" });

        const quote = quoteResponse.body;

        // Add some votes
        if (i < 2) {
          await request(app.getHttpServer())
            .post("/api/v1/votes")
            .set("Authorization", `Bearer ${secondUserToken}`)
            .send({ quoteId: quote.id, value: i === 0 ? 1 : -1 });
        }
      }
    });

    describe("/analytics/quotes (GET)", () => {
      it("should get quotes analytics", async () => {
        const response = await request(app.getHttpServer()).get("/api/v1/analytics/quotes").set("Authorization", `Bearer ${userToken}`).expect(200);

        expect(response.body).toHaveProperty("totalQuotes");
        expect(response.body).toHaveProperty("categoriesCount");
        expect(response.body).toHaveProperty("votesDistribution");
        expect(response.body.totalQuotes).toBe(3);
      });
    });

    describe("/analytics/votes (GET)", () => {
      it("should get votes analytics", async () => {
        const response = await request(app.getHttpServer()).get("/api/v1/analytics/votes").set("Authorization", `Bearer ${userToken}`).expect(200);

        expect(response.body).toHaveProperty("totalVotes");
        expect(response.body).toHaveProperty("upvotes");
        expect(response.body).toHaveProperty("downvotes");
        expect(response.body).toHaveProperty("votesOverTime");
      });
    });
  });

  describe("Error Handling (E2E)", () => {
    it("should handle malformed JSON requests", async () => {
      await request(app.getHttpServer()).post("/api/v1/auth/login").send("{ invalid json").expect(400);
    });

    it("should handle requests with invalid ObjectId format", async () => {
      const registerResponse = await request(app.getHttpServer())
        .post("/api/v1/auth/register")
        .send({ email: "test@example.com", username: "testuser", password: "password123" });

      const token = registerResponse.body.token;

      await request(app.getHttpServer()).get("/api/v1/quotes/invalid-id").set("Authorization", `Bearer ${token}`).expect(400);
    });

    it("should handle expired/invalid JWT tokens", async () => {
      const invalidToken = "invalid.jwt.token";

      await request(app.getHttpServer())
        .post("/api/v1/quotes")
        .set("Authorization", `Bearer ${invalidToken}`)
        .send({ content: "Test quote" })
        .expect(401);
    });
  });
});
