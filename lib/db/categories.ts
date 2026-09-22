"use server";

import { sql } from "@/lib/db/client";
import type { Category } from "@/types";

// created_at es timestamptz: sin castear a texto, el driver lo devuelve
// como Date en vez de string (igual que los numeric necesitan ::float8).
const CATEGORY_COLUMNS = `id, name, to_char(created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at`;

export async function fetchCategories(): Promise<Category[]> {
  const rows = await sql.query(`select ${CATEGORY_COLUMNS} from categories order by name asc`);
  return rows as Category[];
}

export async function insertCategory(name: string): Promise<Category> {
  const rows = await sql.query(
    `insert into categories (name) values ($1)
     on conflict (name) do update set name = excluded.name
     returning ${CATEGORY_COLUMNS}`,
    [name]
  );
  return rows[0] as Category;
}

export async function deleteCategoryById(id: string): Promise<void> {
  await sql.query(`delete from categories where id = $1`, [id]);
}
