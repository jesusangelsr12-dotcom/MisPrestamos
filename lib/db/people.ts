"use server";

import { sql } from "@/lib/db/client";
import type { Person } from "@/types";

// created_at es timestamptz: sin castear a texto, el driver lo devuelve
// como Date en vez de string (igual que los numeric necesitan ::float8).
const PERSON_COLUMNS = `id, name, to_char(created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at`;

export async function fetchPeople(): Promise<Person[]> {
  const rows = await sql.query(`select ${PERSON_COLUMNS} from people order by name asc`);
  return rows as Person[];
}

export async function insertPerson(name: string): Promise<Person> {
  const rows = await sql.query(
    `insert into people (name) values ($1) returning ${PERSON_COLUMNS}`,
    [name]
  );
  return rows[0] as Person;
}

export async function deletePersonById(id: string): Promise<void> {
  await sql.query(`delete from people where id = $1`, [id]);
}
