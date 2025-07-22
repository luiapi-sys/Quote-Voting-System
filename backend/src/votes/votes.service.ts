import { Injectable, ConflictException, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVoteDto } from "./dto/vote.dto";

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  async vote(userId: string, createVoteDto: CreateVoteDto) {
    const { quoteId, value } = createVoteDto;

    // Check if quote exists
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });

    if (!quote) {
      throw new NotFoundException("Quote not found");
    }

    // Check if user already voted for this quote
    const existingVote = await this.prisma.vote.findUnique({ where: { userId_quoteId: { userId, quoteId } } });

    if (existingVote) {
      throw new ConflictException("You have already voted for this quote");
    }

    // Create vote in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the vote
      const vote = await tx.vote.create({
        data: { userId, quoteId, value },
        include: { quote: { select: { id: true, content: true, totalVotes: true } }, user: { select: { id: true, username: true } } }
      });

      // Update quote's total votes
      const updatedQuote = await tx.quote.update({
        where: { id: quoteId },
        data: { totalVotes: { increment: value } },
        include: { createdBy: { select: { id: true, username: true } }, _count: { select: { votes: true } } }
      });

      return { vote, quote: updatedQuote };
    });

    return result;
  }

  async removeVote(userId: string, quoteId: string) {
    // Check if vote exists
    const existingVote = await this.prisma.vote.findUnique({ where: { userId_quoteId: { userId, quoteId } } });

    if (!existingVote) {
      throw new NotFoundException("Vote not found");
    }

    // Remove vote in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Delete the vote
      const deletedVote = await tx.vote.delete({ where: { userId_quoteId: { userId, quoteId } } });

      // Update quote's total votes
      const updatedQuote = await tx.quote.update({
        where: { id: quoteId },
        data: { totalVotes: { decrement: deletedVote.value } },
        include: { createdBy: { select: { id: true, username: true } }, _count: { select: { votes: true } } }
      });

      return { deletedVote, quote: updatedQuote };
    });

    return result;
  }

  async getUserVotes(userId: string) {
    return this.prisma.vote.findMany({
      where: { userId },
      include: { quote: { select: { id: true, content: true, author: true, totalVotes: true, createdAt: true } } },
      orderBy: { createdAt: "desc" }
    });
  }

  async getQuoteVotes(quoteId: string) {
    const votes = await this.prisma.vote.findMany({
      where: { quoteId },
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: "desc" }
    });

    const summary = {
      total: votes.length,
      upvotes: votes.filter((v) => v.value === 1).length,
      downvotes: votes.filter((v) => v.value === -1).length,
      score: votes.reduce((sum, vote) => sum + vote.value, 0)
    };

    return { votes, summary };
  }
}
