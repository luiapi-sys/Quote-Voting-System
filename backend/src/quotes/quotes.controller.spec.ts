import { Test, TestingModule } from "@nestjs/testing";
import { QuotesController } from "./quotes.controller";
import { QuotesService } from "./quotes.service";
import { CreateQuoteDto, UpdateQuoteDto, QueryQuoteDto } from "./dto/quote.dto";
import { Role } from "../../prisma/generated/client";

const mockQuotesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn()
};

const mockUser = { id: 1, username: "testuser", role: Role.USER };
const mockReq = { user: mockUser };

describe("QuotesController", () => {
  let controller: QuotesController;
  let service: QuotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuotesController],
      providers: [{ provide: QuotesService, useValue: mockQuotesService }]
    }).compile();

    controller = module.get<QuotesController>(QuotesController);
    service = module.get<QuotesService>(QuotesService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a new quote", async () => {
      const createQuoteDto: CreateQuoteDto = {
        content: "Test Quote",
        author: "Tester"
      };
      const expectedResult = {
        id: 1,
        ...createQuoteDto,
        createdById: mockUser.id
      };
      mockQuotesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createQuoteDto, mockReq);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createQuoteDto, mockUser.id);
    });
  });

  describe("findAll", () => {
    it("should find all quotes", async () => {
      const query: QueryQuoteDto = { page: 1, limit: 10 };
      const expectedResult = { quotes: [], pagination: {} };
      mockQuotesService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query, mockReq);

      expect(result).toEqual(expectedResult);
      expect(service.findAll).toHaveBeenCalledWith(query, mockUser.id);
    });
  });

  describe("findOne", () => {
    it("should find a single quote by id", async () => {
      const quoteId = 1;
      const expectedResult = {
        id: quoteId,
        content: "Test Quote",
        author: "Tester"
      };
      mockQuotesService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(quoteId, mockReq);

      expect(result).toEqual(expectedResult);
      expect(service.findOne).toHaveBeenCalledWith(quoteId, mockUser.id);
    });
  });

  describe("update", () => {
    it("should update a quote", async () => {
      const quoteId = 1;
      const updateQuoteDto: UpdateQuoteDto = { content: "Updated Quote" };
      const expectedResult = { id: quoteId, content: "Updated Quote" };
      mockQuotesService.update.mockResolvedValue(expectedResult);
      const result = await controller.update(quoteId, updateQuoteDto, mockReq);
      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith(
        quoteId,
        updateQuoteDto,
        mockUser
      );
    });
  });

  describe("remove", () => {
    it("should remove a quote", async () => {
      const quoteId = 1;
      mockQuotesService.remove.mockResolvedValue({ message: "Quote deleted" });
      await controller.remove(quoteId, mockReq);
      expect(service.remove).toHaveBeenCalledWith(quoteId, mockUser);
    });
  });
});
