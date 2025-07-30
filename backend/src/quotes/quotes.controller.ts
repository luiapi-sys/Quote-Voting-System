import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  Request,
  Query,
  UseGuards,
  ParseIntPipe
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { QuotesService } from "./quotes.service";
import { QueryQuoteDto, CreateQuoteDto, UpdateQuoteDto } from "./dto/quote.dto";
import { ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@UseGuards(AuthGuard("jwt"))
@Controller("quotes")
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new quote" })
  @ApiResponse({
    status: 201,
    description: "The quote has been successfully created."
  })
  create(@Body() createQuoteDto: CreateQuoteDto, @Request() req) {
    return this.quotesService.create(createQuoteDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get a list of all active quotes" })
  findAll(@Query() query: QueryQuoteDto, @Request() req) {
    return this.quotesService.findAll(query, req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single quote by ID" })
  @ApiResponse({ status: 404, description: "Quote not found." })
  findOne(@Param("id", ParseIntPipe) id: number, @Request() req) {
    return this.quotesService.findOne(id, req.user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a quote (only if no votes)" })
  @ApiResponse({ status: 200, description: "Quote updated successfully" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateQuoteDto: UpdateQuoteDto,
    @Request() req
  ) {
    return this.quotesService.update(id, updateQuoteDto, req.user);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a quote (Soft delete for user, Hard delete for admin)"
  })
  remove(@Param("id", ParseIntPipe) id: number, @Request() req) {
    return this.quotesService.remove(id, req.user);
  }
}
