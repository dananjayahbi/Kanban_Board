import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Ensure the MongoDB connection string includes a database name.
// Some providers (like Atlas) allow URLs without a path, but Prisma requires a DB name.
function withDatabaseName(url: string | undefined): string {
  if (!url) {
    throw new Error("DATABASE_URL is not set. Please add it to your .env file.");
  }
  try {
    const u = new URL(url);
    const isMongo = u.protocol.startsWith("mongodb");
    const hasDb = u.pathname && u.pathname !== "/";
    if (isMongo && !hasDb) {
      // Default database name if none provided
      u.pathname = "/kanban";
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(
          "DATABASE_URL had no database name. Using default '/kanban'. It's recommended to set an explicit DB name in .env."
        );
      }
    }
    return u.toString();
  } catch (e) {
    // If URL parsing fails, surface a clear message
    throw new Error(
      `Invalid DATABASE_URL: ${e instanceof Error ? e.message : String(e)}\n` +
        "Ensure it is a valid MongoDB connection string."
    );
  }
}

const prismaUrl = withDatabaseName(process.env.DATABASE_URL);

export const prisma =
  global.prisma ?? new PrismaClient({ datasources: { db: { url: prismaUrl } } });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
