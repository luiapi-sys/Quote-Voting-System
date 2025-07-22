import { Controller, Get, Post, Delete, Body, Param, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { VotesService } from "./votes.service";
import { CreateVoteDto } from "./dto/vote.dto";

@ApiTags("Votes")
@Controller("votes")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @ApiOperation({ summary: "Vote for a quote (one vote per user per quote)" })
  @ApiResponse({ status: 201, description: "Vote created successfully" })
  @ApiResponse({ status: 409, description: "User has already voted for this quote" })
  vote(@Request() req, @Body() createVoteDto: CreateVoteDto) {
    return this.votesService.vote(req.user.id, createVoteDto);
  }

  @Delete(":quoteId")
  @ApiOperation({ summary: "Remove vote from a quote" })
  @ApiResponse({ status: 200, description: "Vote removed successfully" })
  @ApiResponse({ status: 404, description: "Vote not found" })
  removeVote(@Request() req, @Param("quoteId") quoteId: string) {
    return this.votesService.removeVote(req.user.id, quoteId);
  }

  @Get("my-votes")
  @ApiOperation({ summary: "Get current user votes" })
  @ApiResponse({ status: 200, description: "User votes retrieved" })
  getUserVotes(@Request() req) {
    return this.votesService.getUserVotes(req.user.id);
  }

  @Get("quote/:quoteId")
  @ApiOperation({ summary: "Get all votes for a specific quote" })
  @ApiResponse({ status: 200, description: "Quote votes retrieved" })
  getQuoteVotes(@Param("quoteId") quoteId: string) {
    return this.votesService.getQuoteVotes(quoteId);
  }
}
