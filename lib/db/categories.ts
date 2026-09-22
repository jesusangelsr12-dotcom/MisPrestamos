"use server";

import { sql } from "@/lib/db/client";
import type { Category } from "@/types";

export async function fetchCategories(): Promise<Category[]> {
  const rows = await sql.query(`select * from categories order by name asc`);
  return rows as Category[];
}

export async function insertCategory(name: string): Promise<Category> {
  const rows = await sql.query(
    `insert into categories (name) values ($1)
     on conflict (name) do update set name = excluded.name
     returning *`,
    [name]
  );
  return rows[0] as Category;
}

export async function deleteCategoryById(id: string): Promise<void> {
  await sql.query(`delete from categories where id = $1`, [id]);
}
