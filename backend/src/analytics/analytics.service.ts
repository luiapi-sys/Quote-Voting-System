import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getVoteAnalytics() {
    const [totalQuotes, totalVotes, totalUsers, topVotedQuotes, voteDistribution, categoryStats, dailyVotes] = await Promise.all([
      // Total quotes
      this.prisma.quote.count({ where: { isActive: true } }),

      // Total votes
      this.prisma.vote.count(),

      // Total users
      this.prisma.user.count(),

      // Top 10 voted quotes
      this.prisma.quote.findMany({
        where: { isActive: true },
        orderBy: { totalVotes: "desc" },
        take: 10,
        select: { id: true, content: true, author: true, totalVotes: true, category: true, createdBy: { select: { username: true } } }
      }),

      // Vote distribution (upvotes vs downvotes)
      this.prisma.vote.groupBy({ by: ["value"], _count: { value: true } }),

      // Category statistics
      this.prisma.quote.groupBy({
        by: ["category"],
        where: { isActive: true, category: { not: null } },
        _count: { category: true },
        _sum: { totalVotes: true },
        orderBy: { _count: { category: "desc" } },
        take: 10
      }),

      // Daily votes for the last 30 days
      this.getDailyVotes()
    ]);

    return {
      overview: { totalQuotes, totalVotes, totalUsers, averageVotesPerQuote: totalQuotes > 0 ? totalVotes / totalQuotes : 0 },
      topVotedQuotes,
      voteDistribution: voteDistribution.map((item) => ({ type: item.value === 1 ? "upvotes" : "downvotes", count: item._count.value })),
      categoryStats: categoryStats.map((item) => ({
        category: item.category || "Uncategorized",
        quoteCount: item._count.category,
        totalVotes: item._sum.totalVotes || 0
      })),
      dailyVotes
    };
  }

  private async getDailyVotes() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const votes = await this.prisma.vote.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true, value: true } });

    // Group by date
    const dailyData = votes.reduce(
      (acc: any, vote: any) => {
        const date = vote.createdAt.toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, upvotes: 0, downvotes: 0, total: 0 };
        }
        if (vote.value === 1) {
          acc[date].upvotes++;
        } else {
          acc[date].downvotes++;
        }
        acc[date].total++;
        return acc;
      },
      {} as Record<string, any>
    );

    // Fill missing dates with 0 votes
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      result.push((dailyData[dateStr] as never) || ({ date: dateStr, upvotes: 0, downvotes: 0, total: 0 } as never));
    }

    return result;
  }

  async getQuoteAnalytics() {
    const [quotesWithoutVotes, mostActiveUsers, tagPopularity, monthlyQuotes] = await Promise.all([
      // Quotes without votes
      this.prisma.quote.count({ where: { isActive: true, totalVotes: 0 } }),

      // Most active users (quote creators)
      this.prisma.user.findMany({
        select: { id: true, username: true, _count: { select: { quotes: true } } },
        orderBy: { quotes: { _count: "desc" } },
        take: 10
      }),

      // Tag popularity
      this.getTagPopularity(),

      // Monthly quote creation
      this.getMonthlyQuotes()
    ]);

    return {
      quotesWithoutVotes,
      mostActiveUsers: mostActiveUsers.map((user) => ({ username: user.username, quoteCount: user._count.quotes })),
      tagPopularity,
      monthlyQuotes
    };
  }

  private async getTagPopularity() {
    const quotes = await this.prisma.quote.findMany({ where: { isActive: true }, select: { tags: true, totalVotes: true } });

    const tagStats = quotes.reduce(
      (acc: any, quote: any) => {
        quote.tags.forEach((tag) => {
          if (!acc[tag]) {
            acc[tag] = { tag, count: 0, totalVotes: 0 };
          }
          acc[tag].count++;
          acc[tag].totalVotes += quote.totalVotes;
        });
        return acc;
      },
      {} as Record<string, any>
    );

    return Object.values(tagStats)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 15);
  }

  private async getMonthlyQuotes() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const quotes = await this.prisma.quote.findMany({ where: { createdAt: { gte: oneYearAgo } }, select: { createdAt: true } });

    // Group by month
    const monthlyData = quotes.reduce(
      (acc: any, quote: any) => {
        const month = quote.createdAt.toISOString().slice(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Fill missing months with 0
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toISOString().slice(0, 7);

      result.push({ month, count: monthlyData[month] || 0 } as never);
    }

    return result;
  }
}
