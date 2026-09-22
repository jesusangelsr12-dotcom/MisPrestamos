"use server";

import { sql } from "@/lib/db/client";
import type { Reimbursement } from "@/types";

export interface ReimbursementInput {
  expense_id: string;
  amount: number;
  date: string;
  note: string | null;
}

const REIMBURSEMENT_COLUMNS = `id, expense_id, date, amount::float8 as amount, note, created_at`;

export async function fetchReimbursementsForExpense(expenseId: string): Promise<Reimbursement[]> {
  const rows = await sql.query(
    `select ${REIMBURSEMENT_COLUMNS} from reimbursements where expense_id = $1 order by date desc, created_at desc`,
    [expenseId]
  );
  return rows as Reimbursement[];
}

// Total reembolsado por gasto, para varios gastos a la vez (evita N+1 al
// pintar la lista de "Gastos a MSI").
export async function fetchReimbursementTotals(expenseIds: string[]): Promise<Record<string, number>> {
  if (expenseIds.length === 0) return {};

  const rows = (await sql.query(
    `select expense_id, sum(amount)::float8 as total from reimbursements where expense_id = any($1) group by expense_id`,
    [expenseIds]
  )) as { expense_id: string; total: number }[];

  const totals: Record<string, number> = {};
  for (const row of rows) totals[row.expense_id] = row.total;
  return totals;
}

export async function insertReimbursement(input: ReimbursementInput): Promise<Reimbursement> {
  const rows = await sql.query(
    `insert into reimbursements (expense_id, date, amount, note)
     values ($1, $2, $3, $4)
     returning ${REIMBURSEMENT_COLUMNS}`,
    [input.expense_id, input.date, input.amount, input.note]
  );
  return rows[0] as Reimbursement;
}

export async function deleteReimbursementById(id: string): Promise<void> {
  await sql.query(`delete from reimbursements where id = $1`, [id]);
}
