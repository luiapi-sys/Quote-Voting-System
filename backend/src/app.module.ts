import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { QuotesModule } from "./quotes/quotes.module";
import { VoteModule } from "./vote/vote.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [PrismaModule, AuthModule, QuotesModule, VoteModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
