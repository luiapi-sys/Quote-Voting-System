// src/quotes/dto/quote.dto.ts
import { IsString, IsOptional, IsArray, IsBoolean, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateQuoteDto {
  @ApiProperty({ example: "Life is what happens when you are busy making other plans." })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: "John Lennon" })
  @IsOptional()
  @IsString()
  author?: string;
}

export class UpdateQuoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class QueryQuotesDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: "life" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: "createdAt", enum: ["createdAt", "totalVotes", "content"] })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({ example: "desc", enum: ["asc", "desc"] })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc" = "desc";
}
