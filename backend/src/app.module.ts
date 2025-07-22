import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { QuotesModule } from "./quotes/quotes.module";
import { VotesModule } from "./votes/votes.module";
import { AnalyticsModule } from "./analytics/analytics.module";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({ secret: process.env.JWT_SECRET || "super-secret-key", signOptions: { expiresIn: "24h" } }),
    PrismaModule,
    AuthModule,
    UsersModule,
    QuotesModule,
    VotesModule,
    AnalyticsModule
  ]
})
export class AppModule {}
