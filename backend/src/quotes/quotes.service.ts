// src/quotes/quotes.service.ts
import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuoteDto, UpdateQuoteDto, QueryQuotesDto } from "./dto/quote.dto";

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createQuoteDto: CreateQuoteDto) {
    return this.prisma.quote.create({
      data: { ...createQuoteDto, createdById: userId },
      include: { createdBy: { select: { id: true, username: true } }, _count: { select: { votes: true } } }
    });
  }

  async findAll(queryDto: QueryQuotesDto) {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = queryDto;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isActive: true };

    if (search) {
      where.OR = [{ content: { contains: search, mode: "insensitive" } }, { author: { contains: search, mode: "insensitive" } }];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === "totalVotes") {
      orderBy.totalVotes = sortOrder;
    } else if (sortBy === "content") {
      orderBy.content = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { createdBy: { select: { id: true, username: true } }, _count: { select: { votes: true } } }
      }),
      this.prisma.quote.count({ where })
    ]);

    return { quotes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, username: true } },
        votes: { include: { user: { select: { id: true, username: true } } } },
        _count: { select: { votes: true } }
      }
    });

    if (!quote) {
      throw new NotFoundException("Quote not found");
    }

    return quote;
  }

  async update(id: string, userId: string, updateQuoteDto: UpdateQuoteDto) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      throw new NotFoundException("Quote not found");
    }

    // Only allow editing if no votes exist
    if (quote.totalVotes > 0) {
      throw new ForbiddenException("Cannot edit quote with existing votes");
    }

    // Only creator can edit
    if (quote.createdById !== userId) {
      throw new ForbiddenException("You can only edit your own quotes");
    }

    return this.prisma.quote.update({
      where: { id },
      data: updateQuoteDto,
      include: { createdBy: { select: { id: true, username: true } }, _count: { select: { votes: true } } }
    });
  }

  async remove(id: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      throw new NotFoundException("Quote not found");
    }

    if (quote.createdById !== userId) {
      throw new ForbiddenException("You can only delete your own quotes");
    }

    return this.prisma.quote.delete({ where: { id } });
  }
}
