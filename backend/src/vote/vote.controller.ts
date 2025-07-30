import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from "@nestjs/common";
import { VoteService } from "./vote.service";
import { AuthGuard } from "@nestjs/passport";
import { CastVoteDto } from "./dto/cast-vote.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("votes")
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post("quote/:quoteId")
  @HttpCode(HttpStatus.OK)
  castVote(
    @Request() req,
    @Param("quoteId", ParseIntPipe) quoteId: number,
    @Body() castVoteDto: CastVoteDto
  ) {
    const userId = req.user.id; // ดึง userId จาก token ที่ผ่านการตรวจสอบแล้ว
    const { value } = castVoteDto;
    return this.voteService.castVote(userId, quoteId, value);
  }
}
