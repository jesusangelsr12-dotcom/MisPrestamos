"use server";

import { sql, buildUpdate } from "@/lib/db/client";
import type { Transaction, TransactionWithRelations } from "@/types";
import { validateShares, type ShareInput } from "@/lib/utils/shares";

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
  shares: ShareInput[]; // vacío si el gasto no es compartido
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
  shares?: ShareInput[]; // si se manda, reemplaza todas las partes del gasto
}

// date y created_at son date/timestamptz: sin castear a texto, el driver de
// Neon los devuelve como Date en vez de string (igual que los numeric
// necesitan ::float8), y todo el código de periodos de esta app asume
// strings "YYYY-MM-DD".
const TRANSACTION_COLUMNS = `id, type,
  date::text as date,
  amount::float8 as amount,
  account_id, source_account_id, category_id, person_id, note, msi_months,
  to_char(created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at`;

const WITH_RELATIONS_SELECT = `
  select
    t.id, t.type,
    t.date::text as date,
    t.amount::float8 as amount,
    t.account_id, t.source_account_id, t.category_id, t.person_id, t.note, t.msi_months,
    to_char(t.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
    case when c.id is null then null else json_build_object('name', c.name) end as category,
    case when p.id is null then null else json_build_object('name', p.name) end as person,
    case when sa.id is null then null else json_build_object('name', sa.name, 'type', sa.type) end as source_account,
    coalesce((
      select json_agg(json_build_object('person_id', s.person_id, 'person_name', sp.name, 'amount', s.amount::float8) order by sp.name)
      from expense_shares s
      join people sp on sp.id = s.person_id
      where s.transaction_id = t.id
    ), '[]'::json) as shares
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

// Movimientos donde la cuenta participa en cualquier dirección (destino u
// origen), usado para el detalle de cuentas que no son tarjeta de crédito.
export async function fetchTransactionsForAccountRangeAnyDirection(
  accountId: string,
  startDate: string,
  endDate: string
): Promise<TransactionWithRelations[]> {
  const rows = await sql.query(
    `${WITH_RELATIONS_SELECT}
     where (t.account_id = $1 or t.source_account_id = $1) and t.date between $2 and $3
     order by t.date desc, t.created_at desc`,
    [accountId, startDate, endDate]
  );
  return rows as TransactionWithRelations[];
}

// Gastos de una tarjeta que todavía pueden tener una cuota MSI pendiente:
// se acotan a los últimos 37 meses porque el MSI más largo soportado es de
// 36 (ver MSI_MONTHS_OPTIONS) — una compra más vieja que eso ya no puede
// tener cuotas por cubrir, y acotar evita traer años de historial completo
// en cada carga.
export async function fetchExpenseTransactionsForAccount(
  accountId: string
): Promise<TransactionWithRelations[]> {
  const rows = await sql.query(
    `${WITH_RELATIONS_SELECT}
     where t.account_id = $1 and t.type = 'expense' and t.date >= (current_date - interval '37 months')
     order by t.date asc`,
    [accountId]
  );
  return rows as TransactionWithRelations[];
}

// Gastos de todas las cuentas en un rango de fechas, usado por el presupuesto
// mensual (que agrupa por categoría, no por cuenta ni por corte de tarjeta).
export async function fetchExpensesInRange(
  startDate: string,
  endDate: string
): Promise<TransactionWithRelations[]> {
  const rows = await sql.query(
    `${WITH_RELATIONS_SELECT} where t.type = 'expense' and t.date between $1 and $2 order by t.date desc`,
    [startDate, endDate]
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
  const shares = input.type === "expense" ? input.shares : [];

  const sharesError = validateShares(input.amount, person_id, shares);
  if (sharesError) throw new Error(sharesError);

  // Gasto y partes en una sola sentencia para que nunca quede un gasto
  // compartido guardado a medias.
  const rows = await sql.query(
    `with t as (
       insert into transactions
         (type, date, amount, account_id, source_account_id, category_id, person_id, note, msi_months)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning *
     ), s as (
       insert into expense_shares (transaction_id, person_id, amount)
       select t.id, x.person_id, x.amount
       from t, json_to_recordset($10::json) as x(person_id uuid, amount numeric)
     )
     select ${TRANSACTION_COLUMNS} from t`,
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
      JSON.stringify(shares),
    ]
  );
  return rows[0] as Transaction;
}

export async function updateTransactionById(
  id: string,
  input: TransactionUpdateInput
): Promise<Transaction> {
  const { shares: sharesInput, ...fields } = input;

  const [current] = (await sql.query(
    `select type, amount::float8 as amount, person_id,
       coalesce((select sum(amount)::float8 from expense_shares where transaction_id = $1), 0) as shares_total
     from transactions where id = $1`,
    [id]
  )) as { type: string; amount: number; person_id: string | null; shares_total: number }[];
  if (!current) throw new Error("Movimiento no encontrado");

  const amount = fields.amount ?? current.amount;
  const personId = fields.person_id !== undefined ? fields.person_id : current.person_id;

  // Un gasto que pasa a ser 100% de una persona deja de tener partes.
  const shares = sharesInput ?? (personId !== null ? [] : undefined);

  if (shares !== undefined) {
    if (current.type !== "expense" && shares.length > 0) {
      throw new Error("Solo los gastos se pueden dividir");
    }
    const sharesError = validateShares(amount, personId, shares);
    if (sharesError) throw new Error(sharesError);
  } else if (current.shares_total > amount + 0.005) {
    throw new Error("Las partes suman más que el nuevo total del gasto");
  }

  // Cambiar solo las partes no toca la fila del gasto: se relee tal cual.
  const hasFieldChanges = Object.values(fields).some((v) => v !== undefined);
  const update = hasFieldChanges
    ? buildUpdate("transactions", id, { ...fields }, TRANSACTION_COLUMNS)
    : { text: `select ${TRANSACTION_COLUMNS} from transactions where id = $1`, values: [id] };
  if (shares === undefined) {
    const rows = await sql.query(update.text, update.values);
    return rows[0] as Transaction;
  }

  const keptPersonIds = shares.map((s) => s.person_id);
  const results = await sql.transaction([
    sql.query(update.text, update.values),
    sql.query(`delete from expense_shares where transaction_id = $1`, [id]),
    sql.query(
      `insert into expense_shares (transaction_id, person_id, amount)
       select $1, x.person_id, x.amount
       from json_to_recordset($2::json) as x(person_id uuid, amount numeric)`,
      [id, JSON.stringify(shares)]
    ),
    // Los reembolsos de quien ya no participa en el gasto dejan de tener
    // sentido (su parte ya no existe).
    sql.query(
      `delete from reimbursements
       where expense_id = $1 and person_id is not null and not (person_id = any($2::uuid[]))`,
      [id, keptPersonIds]
    ),
  ]);

  return results[0][0] as Transaction;
}

export async function deleteTransactionById(id: string): Promise<void> {
  await sql.query(`delete from transactions where id = $1`, [id]);
}
