import { IsIn, IsInt } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CastVoteDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsIn([1, -1], { message: "Vote value must be 1 (upvote) or -1 (downvote)." })
  value: 1 | -1;
}
