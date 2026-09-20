"use server";

import { sql, buildUpdate } from "@/lib/db/client";
import type { LoanGiven, LoanReceived } from "@/types";

export type LoanType = "given" | "received";

export interface LoanGivenInput {
  borrower_name: string;
  amount: number;
  monthly_payment: number;
  total_months: number;
  start_date: string;
  notes: string | null;
}

export interface LoanReceivedInput {
  lender_name: string;
  amount: number;
  monthly_payment: number;
  total_months: number;
  start_date: string;
  notes: string | null;
}

const LOAN_GIVEN_COLUMNS = `id, borrower_name,
  amount::float8 as amount,
  monthly_payment::float8 as monthly_payment,
  total_months, months_paid, start_date, notes, created_at`;

const LOAN_RECEIVED_COLUMNS = `id, lender_name,
  amount::float8 as amount,
  monthly_payment::float8 as monthly_payment,
  total_months, months_paid, start_date, notes, created_at`;

export async function fetchLoansGiven(): Promise<LoanGiven[]> {
  const rows = await sql.query(
    `select ${LOAN_GIVEN_COLUMNS} from loans_given order by created_at desc`
  );
  return rows as LoanGiven[];
}

export async function fetchLoansReceived(): Promise<LoanReceived[]> {
  const rows = await sql.query(
    `select ${LOAN_RECEIVED_COLUMNS} from loans_received order by created_at desc`
  );
  return rows as LoanReceived[];
}

export async function fetchLoanGivenById(id: string): Promise<LoanGiven | null> {
  const rows = await sql.query(
    `select ${LOAN_GIVEN_COLUMNS} from loans_given where id = $1 limit 1`,
    [id]
  );
  return (rows[0] as LoanGiven) ?? null;
}

export async function fetchLoanReceivedById(id: string): Promise<LoanReceived | null> {
  const rows = await sql.query(
    `select ${LOAN_RECEIVED_COLUMNS} from loans_received where id = $1 limit 1`,
    [id]
  );
  return (rows[0] as LoanReceived) ?? null;
}

export async function insertLoanGiven(input: LoanGivenInput): Promise<LoanGiven> {
  const rows = await sql.query(
    `insert into loans_given (borrower_name, amount, monthly_payment, total_months, start_date, notes)
     values ($1, $2, $3, $4, $5, $6)
     returning ${LOAN_GIVEN_COLUMNS}`,
    [
      input.borrower_name,
      input.amount,
      input.monthly_payment,
      input.total_months,
      input.start_date,
      input.notes,
    ]
  );
  return rows[0] as LoanGiven;
}

export async function insertLoanReceived(input: LoanReceivedInput): Promise<LoanReceived> {
  const rows = await sql.query(
    `insert into loans_received (lender_name, amount, monthly_payment, total_months, start_date, notes)
     values ($1, $2, $3, $4, $5, $6)
     returning ${LOAN_RECEIVED_COLUMNS}`,
    [
      input.lender_name,
      input.amount,
      input.monthly_payment,
      input.total_months,
      input.start_date,
      input.notes,
    ]
  );
  return rows[0] as LoanReceived;
}

export async function updateLoanGivenById(
  id: string,
  input: Partial<LoanGivenInput>
): Promise<LoanGiven> {
  const { text, values } = buildUpdate("loans_given", id, { ...input }, LOAN_GIVEN_COLUMNS);
  const rows = await sql.query(text, values);

  if (!rows[0]) throw new Error("Préstamo no encontrado");
  return rows[0] as LoanGiven;
}

export async function updateLoanReceivedById(
  id: string,
  input: Partial<LoanReceivedInput>
): Promise<LoanReceived> {
  const { text, values } = buildUpdate("loans_received", id, { ...input }, LOAN_RECEIVED_COLUMNS);
  const rows = await sql.query(text, values);

  if (!rows[0]) throw new Error("Préstamo no encontrado");
  return rows[0] as LoanReceived;
}

export async function deleteLoanById(id: string, type: LoanType): Promise<void> {
  const table = type === "given" ? "loans_given" : "loans_received";
  await sql.query(`delete from ${table} where id = $1`, [id]);
}

export async function markLoanMonthPaid(
  id: string,
  type: LoanType,
  amount: number,
  monthsCovered: number = 1
): Promise<LoanGiven | LoanReceived> {
  const table = type === "given" ? "loans_given" : "loans_received";
  const columns = type === "given" ? LOAN_GIVEN_COLUMNS : LOAN_RECEIVED_COLUMNS;

  const [current] = (await sql.query(
    `select ${columns} from ${table} where id = $1`,
    [id]
  )) as (LoanGiven & LoanReceived)[];

  if (!current) throw new Error("Préstamo no encontrado");
  if (current.months_paid >= current.total_months) {
    throw new Error("Este préstamo ya está completado");
  }

  const newMonthsPaid = Math.min(current.months_paid + monthsCovered, current.total_months);

  const rows = await sql.query(
    `update ${table} set months_paid = $1 where id = $2 returning ${columns}`,
    [newMonthsPaid, id]
  );

  const entityType = type === "given" ? "loan_given" : "loan_received";
  const entityName = type === "given" ? current.borrower_name : current.lender_name;
  try {
    await sql.query(
      `insert into payment_history (entity_type, entity_id, entity_name, month_number, amount, months_covered)
       values ($1, $2, $3, $4, $5, $6)`,
      [entityType, id, entityName, current.months_paid + 1, amount, monthsCovered]
    );
  } catch (err) {
    console.error("[markLoanMonthPaid] Failed to insert history:", err);
  }

  return rows[0] as LoanGiven | LoanReceived;
}
