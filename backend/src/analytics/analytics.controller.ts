// src/analytics/analytics.controller.ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";

@ApiTags("Analytics")
@Controller("analytics")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("votes")
  @ApiOperation({ summary: "Get vote analytics for charts" })
  @ApiResponse({ status: 200, description: "Vote analytics retrieved successfully" })
  getVoteAnalytics() {
    return this.analyticsService.getVoteAnalytics();
  }

  @Get("quotes")
  @ApiOperation({ summary: "Get quote analytics" })
  @ApiResponse({ status: 200, description: "Quote analytics retrieved successfully" })
  getQuoteAnalytics() {
    return this.analyticsService.getQuoteAnalytics();
  }
}
