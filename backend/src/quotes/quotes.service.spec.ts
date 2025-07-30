import { Test, TestingModule } from "@nestjs/testing";
import { QuotesService } from "./quotes.service";
import { PrismaService } from "../prisma/prisma.service";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Role } from "../../prisma/generated/client";
import { CreateQuoteDto, UpdateQuoteDto } from "./dto/quote.dto";

const mockPrismaService = {
  quote: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};

const mockUser = { id: 1, role: Role.USER };
const mockAdmin = { id: 2, role: Role.ADMIN };
const mockQuote = {
  id: 1,
  content: "A test quote",
  author: "Tester",
  createdById: mockUser.id,
  totalVotes: 0,
  isActive: true
};

describe("QuotesService", () => {
  let service: QuotesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        { provide: PrismaService, useValue: mockPrismaService }
      ]
    }).compile();

    service = module.get<QuotesService>(QuotesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create and return a quote", async () => {
      const createQuoteDto: CreateQuoteDto = {
        content: "New Quote",
        author: "Author"
      };
      mockPrismaService.quote.create.mockResolvedValue({
        ...mockQuote,
        ...createQuoteDto
      });

      const result = await service.create(createQuoteDto, mockUser.id);

      expect(prisma.quote.create).toHaveBeenCalledWith({
        data: {
          content: createQuoteDto.content,
          author: createQuoteDto.author,
          createdById: mockUser.id
        }
      });
      expect(result.content).toBe(createQuoteDto.content);
    });
  });

  describe("findOne", () => {
    it("should find and return a single quote with currentUserVote", async () => {
      const quoteWithVote = { ...mockQuote, votes: [{ value: 1 }] };
      mockPrismaService.quote.findFirst.mockResolvedValue(quoteWithVote);

      const result = await service.findOne(mockQuote.id, mockUser.id);

      expect(prisma.quote.findFirst).toHaveBeenCalledWith({
        where: { id: mockQuote.id, isActive: true },
        include: {
          createdBy: { select: { id: true, username: true } },
          votes: { where: { userId: mockUser.id }, select: { value: true } }
        }
      });
      expect(result.id).toBe(mockQuote.id);
      expect(result.currentUserVote).toBe(1);
    });

    it("should throw NotFoundException if quote is not found", async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(null);
      await expect(service.findOne(999, mockUser.id)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("findAll", () => {
    it("should return a paginated list of quotes", async () => {
      const quotes = [{ ...mockQuote, votes: [] }];
      mockPrismaService.quote.findMany.mockResolvedValue(quotes);
      mockPrismaService.quote.count.mockResolvedValue(1);
      const result = await service.findAll({ page: 1, limit: 10 }, mockUser.id);
      expect(prisma.quote.findMany).toHaveBeenCalled();
      expect(prisma.quote.count).toHaveBeenCalled();
      expect(result.quotes).toHaveLength(1);
      expect(result.quotes[0].currentUserVote).toBe(0);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe("update", () => {
    const updateDto: UpdateQuoteDto = { content: "Updated content" };

    it("should update a quote if user is the creator and there are no votes", async () => {
      mockPrismaService.quote.findUnique.mockResolvedValue(mockQuote);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        ...updateDto
      });

      const result = await service.update(mockQuote.id, updateDto, mockUser);
      expect(prisma.quote.findUnique).toHaveBeenCalledWith({
        where: { id: mockQuote.id }
      });
      expect(prisma.quote.update).toHaveBeenCalledWith({
        where: { id: mockQuote.id },
        data: updateDto,
        include: { createdBy: { select: { id: true, username: true } } }
      });
      expect(result.content).toBe(updateDto.content);
    });

    it("should throw NotFoundException if quote does not exist", async () => {
      mockPrismaService.quote.findUnique.mockResolvedValue(null);
      await expect(service.update(999, updateDto, mockUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw ForbiddenException if quote has votes", async () => {
      mockPrismaService.quote.findUnique.mockResolvedValue({
        ...mockQuote,
        totalVotes: 1
      });
      await expect(
        service.update(mockQuote.id, updateDto, mockUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException if user is not the creator or an admin", async () => {
      const anotherUser = { id: 99, role: Role.USER };
      mockPrismaService.quote.findUnique.mockResolvedValue(mockQuote);
      await expect(
        service.update(mockQuote.id, updateDto, anotherUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it("should allow an admin to update a quote with no votes even if not the creator", async () => {
      mockPrismaService.quote.findUnique.mockResolvedValue({
        ...mockQuote,
        createdById: 999
      }); // Not created by admin
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        ...updateDto
      });

      const result = await service.update(mockQuote.id, updateDto, mockAdmin);
      expect(result.content).toBe(updateDto.content);
    });
  });

  describe("remove", () => {
    it("should soft delete a quote if user is the creator", async () => {
      mockPrismaService.quote.findUnique.mockResolvedValue(mockQuote);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        isActive: false
      });

      await service.remove(mockQuote.id, mockUser);

      expect(prisma.quote.findUnique).toHaveBeenCalledWith({
        where: { id: mockQuote.id }
      });
      expect(prisma.quote.update).toHaveBeenCalledWith({
        where: { id: mockQuote.id },
        data: { isActive: false }
      });
      expect(prisma.quote.delete).not.toHaveBeenCalled();
    });

    it("should hard delete a quote if user is an admin", async () => {
      mockPrismaService.quote.findUnique.mockResolvedValue(mockQuote);
      mockPrismaService.quote.delete.mockResolvedValue(mockQuote);

      await service.remove(mockQuote.id, mockAdmin);

      expect(prisma.quote.findUnique).toHaveBeenCalledWith({
        where: { id: mockQuote.id }
      });
      expect(prisma.quote.delete).toHaveBeenCalledWith({
        where: { id: mockQuote.id }
      });
      expect(prisma.quote.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if quote does not exist", async () => {
      mockPrismaService.quote.findUnique.mockResolvedValue(null);
      await expect(service.remove(999, mockUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw ForbiddenException if user is not the creator and not an admin", async () => {
      const anotherUser = { id: 99, role: Role.USER };
      mockPrismaService.quote.findUnique.mockResolvedValue(mockQuote);
      await expect(service.remove(mockQuote.id, anotherUser)).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
