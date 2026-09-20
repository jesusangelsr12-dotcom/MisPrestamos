"use server";

import { sql, buildUpdate } from "@/lib/db/client";
import type { MSIExpense, MSIExpenseWithCard, ExpenseOwner } from "@/types";

export interface MSIInput {
  card_id: string;
  description: string;
  total_amount: number;
  months: number;
  start_date: string;
  owner: ExpenseOwner;
  owner_name: string | null;
  has_final_payment?: boolean;
  final_payment_amount?: number | null;
}

const WITH_CARD_SELECT = `
  select
    m.id, m.card_id, m.description,
    m.total_amount::float8 as total_amount,
    m.monthly_amount::float8 as monthly_amount,
    m.months, m.months_paid, m.start_date, m.owner, m.owner_name,
    m.has_final_payment,
    m.final_payment_amount::float8 as final_payment_amount,
    m.created_at,
    json_build_object(
      'name', c.name, 'bank', c.bank, 'color', c.color, 'last_four', c.last_four
    ) as card
  from msi_expenses m
  join cards c on c.id = m.card_id
`;

const MSI_COLUMNS = `id, card_id, description,
  total_amount::float8 as total_amount,
  monthly_amount::float8 as monthly_amount,
  months, months_paid, start_date, owner, owner_name,
  has_final_payment,
  final_payment_amount::float8 as final_payment_amount,
  created_at`;

export async function fetchMSIExpenses(): Promise<MSIExpenseWithCard[]> {
  const rows = await sql.query(`${WITH_CARD_SELECT} order by m.created_at desc`);
  return rows as MSIExpenseWithCard[];
}

export async function fetchMSIById(id: string): Promise<MSIExpenseWithCard | null> {
  const rows = await sql.query(`${WITH_CARD_SELECT} where m.id = $1 limit 1`, [id]);
  return (rows[0] as MSIExpenseWithCard) ?? null;
}

export async function insertMSI(input: MSIInput): Promise<MSIExpense> {
  const monthly_amount = input.total_amount / input.months;

  const rows = await sql.query(
    `insert into msi_expenses
       (card_id, description, total_amount, monthly_amount, months, start_date, owner, owner_name, has_final_payment, final_payment_amount)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     returning ${MSI_COLUMNS}`,
    [
      input.card_id,
      input.description,
      input.total_amount,
      monthly_amount,
      input.months,
      input.start_date,
      input.owner,
      input.owner_name,
      input.has_final_payment ?? false,
      input.final_payment_amount ?? null,
    ]
  );

  return rows[0] as MSIExpense;
}

export async function updateMSIById(
  id: string,
  input: Partial<Omit<MSIInput, "card_id">>
): Promise<MSIExpense> {
  const updateData: Record<string, unknown> = { ...input };

  if (input.total_amount !== undefined && input.months !== undefined) {
    updateData.monthly_amount = input.total_amount / input.months;
  } else if (input.total_amount !== undefined) {
    const [current] = (await sql.query(
      `select months from msi_expenses where id = $1`,
      [id]
    )) as { months: number }[];
    if (current) updateData.monthly_amount = input.total_amount / current.months;
  } else if (input.months !== undefined) {
    const [current] = (await sql.query(
      `select total_amount::float8 as total_amount from msi_expenses where id = $1`,
      [id]
    )) as { total_amount: number }[];
    if (current) updateData.monthly_amount = current.total_amount / input.months;
  }

  const { text, values } = buildUpdate("msi_expenses", id, updateData, MSI_COLUMNS);
  const rows = await sql.query(text, values);

  if (!rows[0]) throw new Error("Gasto MSI no encontrado");
  return rows[0] as MSIExpense;
}

export async function deleteMSIById(id: string): Promise<void> {
  await sql.query(`delete from msi_expenses where id = $1`, [id]);
}

export async function markMSIMonthPaid(
  id: string,
  amount: number,
  monthsCovered: number = 1
): Promise<MSIExpense> {
  const [current] = (await sql.query(
    `select months_paid, months, description, has_final_payment from msi_expenses where id = $1`,
    [id]
  )) as { months_paid: number; months: number; description: string; has_final_payment: boolean }[];

  if (!current) throw new Error("Gasto MSI no encontrado");
  const totalMonths = current.has_final_payment ? current.months + 1 : current.months;
  if (current.months_paid >= totalMonths) {
    throw new Error("Este gasto ya está completado");
  }

  const newMonthsPaid = Math.min(current.months_paid + monthsCovered, totalMonths);

  const rows = await sql.query(
    `update msi_expenses set months_paid = $1 where id = $2 returning ${MSI_COLUMNS}`,
    [newMonthsPaid, id]
  );

  try {
    await sql.query(
      `insert into payment_history (entity_type, entity_id, entity_name, month_number, amount, months_covered)
       values ('msi', $1, $2, $3, $4, $5)`,
      [id, current.description, current.months_paid + 1, amount, monthsCovered]
    );
  } catch (err) {
    console.error("[markMSIMonthPaid] Failed to insert history:", err);
  }

  return rows[0] as MSIExpense;
}

export async function fetchMSIPaymentTotals(): Promise<Record<string, number>> {
  try {
    const rows = (await sql.query(
      `select entity_id, amount::float8 as amount from payment_history where entity_type = 'msi'`
    )) as { entity_id: string; amount: number }[];

    const totals: Record<string, number> = {};
    for (const row of rows) {
      totals[row.entity_id] = (totals[row.entity_id] ?? 0) + row.amount;
    }
    return totals;
  } catch {
    return {};
  }
}

export async function fetchLoanPaymentTotals(
  entityType: "loan_given" | "loan_received"
): Promise<Record<string, number>> {
  try {
    const rows = (await sql.query(
      `select entity_id, amount::float8 as amount from payment_history where entity_type = $1`,
      [entityType]
    )) as { entity_id: string; amount: number }[];

    const totals: Record<string, number> = {};
    for (const row of rows) {
      totals[row.entity_id] = (totals[row.entity_id] ?? 0) + row.amount;
    }
    return totals;
  } catch {
    return {};
  }
}
