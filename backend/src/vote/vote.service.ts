import {
  Injectable,
  NotFoundException,
  ConflictException
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class VoteService {
  constructor(private prisma: PrismaService) {}

  async castVote(userId: number, quoteId: number, value: 1 | -1) {
    // ตรวจสอบว่า Quote ที่จะโหวตมีอยู่จริง
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId }
    });
    if (!quote) {
      throw new NotFoundException(`Quote with ID ${quoteId} not found.`);
    }

    // ค้นหาโหวตเดิมของผู้ใช้สำหรับ Quote นี้
    const existingVote = await this.prisma.vote.findUnique({
      where: { userId_quoteId: { userId, quoteId } }
    });

    if (existingVote) {
      throw new ConflictException("You Already Voted");
    }

    // ใช้ Transaction เพื่อให้แน่ใจว่าการอัปเดตข้อมูลทั้งหมดสำเร็จหรือล้มเหลวพร้อมกัน
    return this.prisma.$transaction(async (tx) => {
      await tx.vote.create({ data: { userId, quoteId, value } });
      return tx.quote.update({
        where: { id: quoteId },
        data: { totalVotes: { increment: value } }
      });
    });
  }
}
