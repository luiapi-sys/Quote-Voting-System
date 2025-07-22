// src/quotes/quotes.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { QuotesService } from "./quotes.service";
import { CreateQuoteDto, UpdateQuoteDto, QueryQuotesDto } from "./dto/quote.dto";

@ApiTags("Quotes")
@Controller("quotes")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new quote" })
  @ApiResponse({ status: 201, description: "Quote created successfully" })
  create(@Request() req, @Body() createQuoteDto: CreateQuoteDto) {
    return this.quotesService.create(req.user.id, createQuoteDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all quotes with pagination and filters" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "category", required: false, type: String })
  @ApiQuery({ name: "tags", required: false, type: String })
  @ApiQuery({ name: "sortBy", required: false, type: String })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"] })
  findAll(@Query() query: QueryQuotesDto) {
    return this.quotesService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a quote by ID" })
  @ApiResponse({ status: 200, description: "Quote found" })
  @ApiResponse({ status: 404, description: "Quote not found" })
  findOne(@Param("id") id: string) {
    return this.quotesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a quote (only if no votes exist)" })
  @ApiResponse({ status: 200, description: "Quote updated successfully" })
  @ApiResponse({ status: 403, description: "Cannot edit quote with votes" })
  update(@Param("id") id: string, @Request() req, @Body() updateQuoteDto: UpdateQuoteDto) {
    return this.quotesService.update(id, req.user.id, updateQuoteDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a quote" })
  @ApiResponse({ status: 200, description: "Quote deleted successfully" })
  remove(@Param("id") id: string, @Request() req) {
    return this.quotesService.remove(id, req.user.id);
  }
}
