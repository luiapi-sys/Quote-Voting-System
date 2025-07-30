import { Module } from "@nestjs/common";
import { VoteService } from "./vote.service";
import { VoteController } from "./vote.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule], // Import PrismaModule เพื่อให้ VoteService สามารถใช้ PrismaClient ได้
  controllers: [VoteController],
  providers: [VoteService],
  exports: [VoteService]
})
export class VoteModule {}
