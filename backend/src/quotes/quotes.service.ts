import {
  Injectable,
  NotFoundException,
  ForbiddenException
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "../../prisma/generated/client";
import { QueryQuoteDto, CreateQuoteDto, UpdateQuoteDto } from "./dto/quote.dto";

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async create(createQuoteDto: CreateQuoteDto, userId: number) {
    return this.prisma.quote.create({
      data: {
        content: createQuoteDto.content,
        author: createQuoteDto.author,
        createdById: userId
      }
    });
  }

  async findOne(quoteId: number, currentUserId?: number) {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, isActive: true },
      include: {
        createdBy: { select: { id: true, username: true } },
        votes: { where: { userId: currentUserId }, select: { value: true } }
      }
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${quoteId} not found.`);
    }

    const { votes, ...quoteData } = quote;
    return {
      ...quoteData,
      currentUserVote: votes.length > 0 ? votes[0].value : 0
    };
  }

  async findAll(query: QueryQuoteDto, currentUserId?: number) {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } }
      ];
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
        include: {
          createdBy: { select: { id: true, username: true } },
          votes: { where: { userId: currentUserId }, select: { value: true } }
          // _count: { select: { votes: true } },
        }
      }),
      this.prisma.quote.count({ where })
    ]);

    // จัดรูปแบบข้อมูลผลลัพธ์ให้ใช้งานง่าย
    const quotesNew = quotes.map((quote) => {
      const { votes, ...quoteData } = quote;
      return {
        ...quoteData,
        currentUserVote: votes.length > 0 ? votes[0].value : 0
      };
    });

    return {
      quotes: quotesNew,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async update(
    id: number,
    updateQuoteDto: UpdateQuoteDto,
    user: { id: number; role: Role }
  ) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      throw new NotFoundException("Quote not found");
    }

    // Only allow editing if no votes exist
    if (quote.totalVotes > 0) {
      throw new ForbiddenException("Cannot edit quote with existing votes");
    }

    // Only creator can edit
    if (quote.createdById !== user.id && user.role !== Role.ADMIN) {
      throw new ForbiddenException("You can only edit your own quotes");
    }

    return this.prisma.quote.update({
      where: { id },
      data: updateQuoteDto,
      include: { createdBy: { select: { id: true, username: true } } }
    });
  }

  async remove(quoteId: number, user: { id: number; role: Role }) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId }
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID ${quoteId} not found.`);
    }

    // Admin สามารถลบถาวรได้ทันที
    if (user.role === Role.ADMIN) {
      return this.prisma.quote.delete({ where: { id: quoteId } });
    }

    // User ทั่วไปสามารถลบได้เฉพาะ Quote ของตัวเอง (เป็นการ soft delete)
    if (quote.createdById !== user.id) {
      throw new ForbiddenException("You can only delete your own quotes.");
    }

    return this.prisma.quote.update({
      where: { id: quoteId },
      data: { isActive: false } // Soft delete
    });
  }
}
