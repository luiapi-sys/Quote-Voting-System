import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect();
});

// Global test utilities
global.testUtils = {
  createTestUser: async (overrides = {}) => {
    const defaultUser = { email: "test@example.com", username: "testuser", password: "password123", ...overrides };
    return defaultUser;
  },

  createTestQuote: async (overrides = {}) => {
    const defaultQuote = { content: "Test quote content", author: "Test Author", category: "Test Category", tags: ["test"], ...overrides };
    return defaultQuote;
  }
};
