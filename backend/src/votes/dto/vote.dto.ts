import { IsIn, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateVoteDto {
  @ApiProperty({ example: "quote-id-here" })
  @IsString()
  quoteId: string;

  @ApiProperty({ example: 1, enum: [1, -1], description: "1 for upvote, -1 for downvote" })
  @IsIn([1, -1])
  value: number;
}
