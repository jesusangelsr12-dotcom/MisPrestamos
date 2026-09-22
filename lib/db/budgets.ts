"use server";

import { sql, buildUpdate } from "@/lib/db/client";
import type { Budget, BudgetWithCategory } from "@/types";

export interface BudgetInput {
  category_id: string;
  month: string; // YYYY-MM-01
  amount: number;
}

const WITH_CATEGORY_SELECT = `
  select
    b.id, b.category_id, b.month,
    b.amount::float8 as amount,
    b.created_at,
    json_build_object('name', c.name) as category
  from budgets b
  join categories c on c.id = b.category_id
`;

export async function fetchBudgetsForMonth(month: string): Promise<BudgetWithCategory[]> {
  const rows = await sql.query(
    `${WITH_CATEGORY_SELECT} where b.month = $1 order by c.name asc`,
    [month]
  );
  return rows as BudgetWithCategory[];
}

export async function upsertBudget(input: BudgetInput): Promise<Budget> {
  const rows = await sql.query(
    `insert into budgets (category_id, month, amount)
     values ($1, $2, $3)
     on conflict (category_id, month) do update set amount = excluded.amount
     returning id, category_id, month, amount::float8 as amount, created_at`,
    [input.category_id, input.month, input.amount]
  );
  return rows[0] as Budget;
}

export async function updateBudgetById(
  id: string,
  amount: number
): Promise<Budget> {
  const { text, values } = buildUpdate(
    "budgets",
    id,
    { amount },
    "id, category_id, month, amount::float8 as amount, created_at"
  );
  const rows = await sql.query(text, values);

  if (!rows[0]) throw new Error("Presupuesto no encontrado");
  return rows[0] as Budget;
}

export async function deleteBudgetById(id: string): Promise<void> {
  await sql.query(`delete from budgets where id = $1`, [id]);
}
