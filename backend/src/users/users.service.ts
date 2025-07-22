import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { quotes: true, votes: true } }
      }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        quotes: { select: { id: true, content: true, totalVotes: true, createdAt: true }, orderBy: { totalVotes: "desc" } },
        votes: { include: { quote: { select: { id: true, content: true, author: true, totalVotes: true } } }, orderBy: { createdAt: "desc" } },
        _count: { select: { quotes: true, votes: true } }
      }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const totalVotesReceived = user.quotes.reduce((sum, quote) => sum + quote.totalVotes, 0);
    const averageVotesPerQuote = user._count.quotes > 0 ? totalVotesReceived / user._count.quotes : 0;
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      stats: {
        quotesCreated: user._count.quotes,
        votesGiven: user._count.votes,
        totalVotesReceived,
        averageVotesPerQuote: Math.round(averageVotesPerQuote * 100) / 100
      }
    };
  }
}
