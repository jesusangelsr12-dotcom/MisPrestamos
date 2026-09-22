"use server";

import { sql } from "@/lib/db/client";
import type { Person } from "@/types";

export async function fetchPeople(): Promise<Person[]> {
  const rows = await sql.query(`select * from people order by name asc`);
  return rows as Person[];
}

export async function insertPerson(name: string): Promise<Person> {
  const rows = await sql.query(
    `insert into people (name) values ($1) returning *`,
    [name]
  );
  return rows[0] as Person;
}

export async function deletePersonById(id: string): Promise<void> {
  await sql.query(`delete from people where id = $1`, [id]);
}
