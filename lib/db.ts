import { neon } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/models";

export type DatabaseInstance = NeonHttpDatabase<typeof schema>;

let _db: DatabaseInstance | null = null;

export function getDb(): DatabaseInstance {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  const client = neon(connectionString);
  _db = drizzle(client, { schema });
  return _db;
}

export const db = new Proxy({} as DatabaseInstance, {
  get(_target, prop) {
    const instance = getDb();
    const record = instance as unknown as Record<string | symbol, unknown>;
    const value = record[prop];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
});

export { schema };
