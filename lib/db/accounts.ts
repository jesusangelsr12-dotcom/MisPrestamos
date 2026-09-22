"use server";

import { sql, buildUpdate } from "@/lib/db/client";
import type { Account } from "@/types";

export type AccountInput = Omit<Account, "id" | "created_at">;

const ACCOUNT_COLUMNS = `id, name, type, cut_off_day, payment_due_day, created_at`;

export async function fetchAccounts(): Promise<Account[]> {
  const rows = await sql.query(
    `select ${ACCOUNT_COLUMNS} from accounts order by created_at desc`
  );
  return rows as Account[];
}

export async function fetchAccountById(id: string): Promise<Account | null> {
  const rows = await sql.query(
    `select ${ACCOUNT_COLUMNS} from accounts where id = $1 limit 1`,
    [id]
  );
  return (rows[0] as Account) ?? null;
}

export async function insertAccount(account: AccountInput): Promise<Account> {
  const rows = await sql.query(
    `insert into accounts (name, type, cut_off_day, payment_due_day)
     values ($1, $2, $3, $4)
     returning ${ACCOUNT_COLUMNS}`,
    [
      account.name,
      account.type,
      account.cut_off_day,
      account.payment_due_day,
    ]
  );
  return rows[0] as Account;
}

export async function updateAccountById(
  id: string,
  account: Partial<AccountInput>
): Promise<Account> {
  const { text, values } = buildUpdate("accounts", id, { ...account }, ACCOUNT_COLUMNS);
  const rows = await sql.query(text, values);

  if (!rows[0]) throw new Error("Cuenta no encontrada");
  return rows[0] as Account;
}

export async function deleteAccountById(id: string): Promise<void> {
  const [{ count }] = (await sql.query(
    `select count(*)::int as count
     from transactions
     where account_id = $1 or source_account_id = $1`,
    [id]
  )) as { count: number }[];

  if (count > 0) {
    throw new Error(
      "No se puede eliminar: esta cuenta tiene movimientos registrados"
    );
  }

  await sql.query(`delete from accounts where id = $1`, [id]);
}
