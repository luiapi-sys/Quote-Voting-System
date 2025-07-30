import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "../../prisma/generated/client";
import { withAccelerate } from "@prisma/extension-accelerate";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ datasources: { db: { url: "" } } });
    this.$extends(withAccelerate());
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
