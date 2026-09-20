"use server";

import { sql } from "@/lib/db/client";
import type { PaymentHistory, PaymentEntityType } from "@/types";

const COLUMNS = `id, entity_type, entity_id, entity_name, month_number,
  amount::float8 as amount, months_covered, paid_at, created_at`;

export async function insertPaymentHistory(params: {
  entity_type: PaymentEntityType;
  entity_id: string;
  entity_name: string;
  month_number: number;
  amount: number;
}): Promise<PaymentHistory> {
  const rows = await sql.query(
    `insert into payment_history (entity_type, entity_id, entity_name, month_number, amount)
     values ($1, $2, $3, $4, $5)
     returning ${COLUMNS}`,
    [
      params.entity_type,
      params.entity_id,
      params.entity_name,
      params.month_number,
      params.amount,
    ]
  );
  return rows[0] as PaymentHistory;
}

export async function fetchHistoryByEntity(
  entityId: string
): Promise<PaymentHistory[]> {
  const rows = await sql.query(
    `select ${COLUMNS} from payment_history where entity_id = $1 order by paid_at desc`,
    [entityId]
  );
  return rows as PaymentHistory[];
}

export async function fetchAllHistory(): Promise<PaymentHistory[]> {
  const rows = await sql.query(
    `select ${COLUMNS} from payment_history order by paid_at desc`
  );
  return rows as PaymentHistory[];
}
