import { Test, TestingModule } from "@nestjs/testing";
import { VoteController } from "./vote.controller";
import { VoteService } from "./vote.service";
import { CastVoteDto } from "./dto/cast-vote.dto";

const mockVoteService = { castVote: jest.fn() };

const mockUser = { id: 1, username: "testvoter" };
const mockReq = { user: mockUser };

describe("VoteController", () => {
  let controller: VoteController;
  let service: VoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoteController],
      providers: [{ provide: VoteService, useValue: mockVoteService }]
    }).compile();

    controller = module.get<VoteController>(VoteController);
    service = module.get<VoteService>(VoteService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("castVote", () => {
    it("should call voteService.castVote with correct parameters and return the result", async () => {
      const quoteId = 10;
      const castVoteDto: CastVoteDto = { value: 1 };
      const expectedResult = { id: quoteId, totalVotes: 1 };

      mockVoteService.castVote.mockResolvedValue(expectedResult);
      const result = await controller.castVote(mockReq, quoteId, castVoteDto);
      expect(service.castVote).toHaveBeenCalledWith(
        mockUser.id,
        quoteId,
        castVoteDto.value
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
