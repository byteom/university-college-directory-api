import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configure WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

let prisma: PrismaClient;

function getPrismaClient() {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Create Neon adapter with connection string directly (Prisma 7 style)
    const adapter = new PrismaNeon({ connectionString });

    // @ts-ignore - Prisma 7 adapter types
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

// Export a proxy that lazily initializes the client
export default new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrismaClient() as any)[prop];
  },
});
