import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export function buildUpdate(
  table: string,
  id: string,
  fields: Record<string, unknown>,
  returning: string = "*"
): { text: string; values: unknown[] } {
  const keys = Object.keys(fields).filter((k) => fields[k] !== undefined);
  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
  const values: unknown[] = keys.map((k) => fields[k]);
  values.push(id);

  return {
    text: `update ${table} set ${setClauses.join(", ")} where id = $${values.length} returning ${returning}`,
    values,
  };
}
