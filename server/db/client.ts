import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

const dbFile = process.env.DATABASE_URL ?? "./data/releasebridge.sqlite";

mkdirSync(dirname(dbFile), { recursive: true });

const sqlite = new Database(dbFile, { create: true });
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqlite);
export { sqlite };
