import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsInt,
  IsBoolean,
  Min,
  Max
} from "class-validator";

export class CreateQuoteDto {
  @ApiProperty({
    description: "The content of the quote",
    example: "The only way to do great work is to love what you do."
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content: string;

  @ApiProperty({
    description: "The author of the quote (optional)",
    example: "Steve Jobs",
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  author?: string;
}

export class UpdateQuoteDto {
  @ApiPropertyOptional({ example: "Update content" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: "Update author" })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QueryQuoteDto {
  @ApiPropertyOptional({ description: "Search keyword in quote content" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({
    example: "createdAt",
    enum: ["createdAt", "totalVotes", "content"],
    default: "createdAt"
  })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ example: "desc", enum: ["asc", "desc"] })
  @IsOptional()
  @IsString()
  sortOrder?: string = "desc";
}
