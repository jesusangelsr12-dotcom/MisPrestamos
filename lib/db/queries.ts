import { sql } from "@/lib/db/client";
import type { PinAuth } from "@/types";

export async function fetchPin(): Promise<PinAuth | null> {
  const rows = await sql.query(`select * from pin_auth limit 1`);
  return (rows[0] as PinAuth) ?? null;
}

export async function insertPin(hashedPin: string): Promise<void> {
  await sql.query(`insert into pin_auth (hashed_pin) values ($1)`, [hashedPin]);
}

export async function pinExists(): Promise<boolean> {
  const [{ count }] = (await sql.query(
    `select count(*)::int as count from pin_auth`
  )) as { count: number }[];
  return count > 0;
}
