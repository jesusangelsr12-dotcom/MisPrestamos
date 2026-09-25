"use server";

import { sql } from "@/lib/db/client";
import type { Reimbursement } from "@/types";
import { reimbursementKey } from "@/lib/utils/shares";

export interface ReimbursementInput {
  expense_id: string;
  person_id: string | null; // null = dueño del gasto completo
  installment_number: number;
  amount: number;
  date: string;
}

// date y created_at son date/timestamptz: sin castear a texto, el driver
// los devuelve como Date en vez de string (igual que los numeric necesitan
// ::float8).
const REIMBURSEMENT_COLUMNS = `id, expense_id, person_id, installment_number,
  date::text as date,
  amount::float8 as amount,
  note,
  to_char(created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at`;

// Reembolsos de una persona en un gasto. personId null = el dueño del gasto
// completo; en un gasto compartido, cada persona tiene los suyos.
export async function fetchReimbursementsForExpense(
  expenseId: string,
  personId: string | null
): Promise<Reimbursement[]> {
  const rows = await sql.query(
    `select ${REIMBURSEMENT_COLUMNS} from reimbursements
     where expense_id = $1 and person_id is not distinct from $2
     order by installment_number asc nulls last, date asc`,
    [expenseId, personId]
  );
  return rows as Reimbursement[];
}

// Total reembolsado por gasto y persona (llave: reimbursementKey), para
// varios gastos a la vez (evita N+1 al pintar la lista de "Gastos a MSI").
export async function fetchReimbursementTotals(expenseIds: string[]): Promise<Record<string, number>> {
  if (expenseIds.length === 0) return {};

  const rows = (await sql.query(
    `select expense_id, person_id, sum(amount)::float8 as total
     from reimbursements where expense_id = any($1)
     group by expense_id, person_id`,
    [expenseIds]
  )) as { expense_id: string; person_id: string | null; total: number }[];

  const totals: Record<string, number> = {};
  for (const row of rows) totals[reimbursementKey(row.expense_id, row.person_id)] = row.total;
  return totals;
}

// Marca una cuota como pagada hoy. El índice único (expense_id, persona,
// installment_number) evita registrar la misma cuota dos veces.
export async function insertReimbursement(input: ReimbursementInput): Promise<Reimbursement> {
  const rows = await sql.query(
    `insert into reimbursements (expense_id, person_id, installment_number, date, amount)
     values ($1, $2, $3, $4, $5)
     returning ${REIMBURSEMENT_COLUMNS}`,
    [input.expense_id, input.person_id, input.installment_number, input.date, input.amount]
  );
  return rows[0] as Reimbursement;
}

export async function deleteReimbursementById(id: string): Promise<void> {
  await sql.query(`delete from reimbursements where id = $1`, [id]);
}
