"use server";

import { sql, buildUpdate } from "@/lib/db/client";
import type { Transaction, TransactionWithRelations } from "@/types";

interface BaseTransactionInput {
  date: string;
  amount: number;
  account_id: string;
  note: string | null;
}

export interface ExpenseInput extends BaseTransactionInput {
  type: "expense";
  category_id: string | null;
  person_id: string | null;
  msi_months: number;
}

export interface PaymentInput extends BaseTransactionInput {
  type: "payment";
  category_id: string | null;
  source_account_id: string;
}

export interface TransferInput extends BaseTransactionInput {
  type: "transfer";
  source_account_id: string;
}

export type TransactionInput = ExpenseInput | PaymentInput | TransferInput;

export interface TransactionUpdateInput {
  date?: string;
  amount?: number;
  category_id?: string | null;
  person_id?: string | null;
  note?: string | null;
  msi_months?: number;
}

const TRANSACTION_COLUMNS = `id, type, date,
  amount::float8 as amount,
  account_id, source_account_id, category_id, person_id, note, msi_months, created_at`;

const WITH_RELATIONS_SELECT = `
  select
    t.id, t.type, t.date,
    t.amount::float8 as amount,
    t.account_id, t.source_account_id, t.category_id, t.person_id, t.note, t.msi_months, t.created_at,
    case when c.id is null then null else json_build_object('name', c.name) end as category,
    case when p.id is null then null else json_build_object('name', p.name) end as person,
    case when sa.id is null then null else json_build_object('name', sa.name, 'type', sa.type) end as source_account
  from transactions t
  left join categories c on c.id = t.category_id
  left join people p on p.id = t.person_id
  left join accounts sa on sa.id = t.source_account_id
`;

export async function fetchTransactionsForAccountPeriod(
  accountId: string,
  startDate: string,
  endDate: string
): Promise<TransactionWithRelations[]> {
  const rows = await sql.query(
    `${WITH_RELATIONS_SELECT}
     where t.account_id = $1 and t.date between $2 and $3
     order by t.date desc, t.created_at desc`,
    [accountId, startDate, endDate]
  );
  return rows as TransactionWithRelations[];
}

export async function fetchTransactionById(id: string): Promise<TransactionWithRelations | null> {
  const rows = await sql.query(`${WITH_RELATIONS_SELECT} where t.id = $1 limit 1`, [id]);
  return (rows[0] as TransactionWithRelations) ?? null;
}

export async function insertTransaction(input: TransactionInput): Promise<Transaction> {
  const category_id = input.type !== "transfer" ? input.category_id : null;
  const person_id = input.type === "expense" ? input.person_id : null;
  const msi_months = input.type === "expense" ? input.msi_months : 0;
  const source_account_id = input.type === "expense" ? null : input.source_account_id;

  const rows = await sql.query(
    `insert into transactions
       (type, date, amount, account_id, source_account_id, category_id, person_id, note, msi_months)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning ${TRANSACTION_COLUMNS}`,
    [
      input.type,
      input.date,
      input.amount,
      input.account_id,
      source_account_id,
      category_id,
      person_id,
      input.note,
      msi_months,
    ]
  );
  return rows[0] as Transaction;
}

export async function updateTransactionById(
  id: string,
  input: TransactionUpdateInput
): Promise<Transaction> {
  const { text, values } = buildUpdate("transactions", id, { ...input }, TRANSACTION_COLUMNS);
  const rows = await sql.query(text, values);

  if (!rows[0]) throw new Error("Movimiento no encontrado");
  return rows[0] as Transaction;
}

export async function deleteTransactionById(id: string): Promise<void> {
  await sql.query(`delete from transactions where id = $1`, [id]);
}
