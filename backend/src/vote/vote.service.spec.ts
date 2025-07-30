import { Test, TestingModule } from "@nestjs/testing";
import { VoteService } from "./vote.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConflictException, NotFoundException } from "@nestjs/common";

const mockPrismaService = {
  quote: { findUnique: jest.fn(), update: jest.fn() },
  vote: { findUnique: jest.fn(), create: jest.fn() },
  $transaction: jest.fn()
};

describe("VoteService", () => {
  let service: VoteService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoteService,
        { provide: PrismaService, useValue: mockPrismaService }
      ]
    }).compile();

    service = module.get<VoteService>(VoteService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("castVote", () => {
    const userId = 1;
    const quoteId = 1;
    const mockQuote = {
      id: quoteId,
      content: "A quote to vote on",
      totalVotes: 0
    };

    it("should successfully cast an upvote and update quote totalVotes", async () => {
      const value = 1;
      const updatedQuote = {
        ...mockQuote,
        totalVotes: mockQuote.totalVotes + value
      };

      mockPrismaService.quote.findUnique.mockResolvedValue(mockQuote);
      mockPrismaService.vote.findUnique.mockResolvedValue(null);

      // Mock the transaction
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          vote: { create: jest.fn() },
          quote: { update: jest.fn().mockResolvedValue(updatedQuote) }
        };
        return await callback(mockTx);
      });

      const result = await service.castVote(userId, quoteId, value);

      expect(prisma.quote.findUnique).toHaveBeenCalledWith({
        where: { id: quoteId }
      });
      expect(prisma.vote.findUnique).toHaveBeenCalledWith({
        where: { userId_quoteId: { userId, quoteId } }
      });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(updatedQuote);
    });

    it("should successfully cast a downvote and update quote totalVotes", async () => {
      const value = -1;
      mockPrismaService.quote.findUnique.mockResolvedValue(mockQuote);
      mockPrismaService.vote.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (cb) =>
        cb({ vote: { create: jest.fn() }, quote: { update: jest.fn() } })
      );

      await service.castVote(userId, quoteId, value);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("should throw NotFoundException if the quote does not exist", async () => {
      mockPrismaService.quote.findUnique.mockResolvedValue(null);

      await expect(service.castVote(userId, 999, 1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw ConflictException if the user has already voted on the quote", async () => {
      mockPrismaService.quote.findUnique.mockResolvedValue(mockQuote);
      mockPrismaService.vote.findUnique.mockResolvedValue({
        id: 1,
        userId,
        quoteId,
        value: 1
      });

      await expect(service.castVote(userId, quoteId, 1)).rejects.toThrow(
        ConflictException
      );
    });
  });
});
