import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { schema } from "./schema/auth";
import { story, userXpTotals, xpLogs } from "./schema/story";

config({ path: ".env" });

export const db = drizzle({
  connection: {
    url: process.env.DB_URL,
    ssl: false,
  },
  casing: "snake_case",
  schema: { ...schema, story, xpLogs, userXpTotals },
});
