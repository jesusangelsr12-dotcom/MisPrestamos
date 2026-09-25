// Reglas de los gastos compartidos: un gasto que es en parte mío y en parte
// de una o más personas. Cada parte es un monto sobre el total del gasto (no
// sobre la cuota mensual); mi parte es lo que sobra.
import { z } from "zod";
import type { ExpenseShare } from "@/types";

export interface ShareInput {
  person_id: string;
  amount: number;
}

// Tolerancia para comparar sumas de montos con centavos.
const CENT_EPSILON = 0.005;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function sumShares(shares: Pick<ShareInput, "amount">[]): number {
  return round2(shares.reduce((sum, s) => sum + s.amount, 0));
}

// Mi parte de un gasto compartido (nunca negativa).
export function myShareAmount(total: number, shares: Pick<ShareInput, "amount">[]): number {
  return Math.max(round2(total - sumShares(shares)), 0);
}

// Parte que me corresponde de un gasto: completo si es "Mío" sin partes,
// cero si es 100% de otra persona, o lo que sobra si es compartido.
export function myPartOfExpense(expense: { amount: number; person_id: string | null; shares: ExpenseShare[] }): number {
  if (expense.person_id !== null) return 0;
  return myShareAmount(expense.amount, expense.shares);
}

// Reparto en partes iguales entre las personas seleccionadas y, si
// includeMe, yo. Los centavos que no dividen exacto se quedan en mi parte (o
// en la última persona si yo no participo), para que la suma cuadre al centavo.
export function splitEvenly(total: number, personIds: string[], includeMe: boolean): ShareInput[] {
  const participants = personIds.length + (includeMe ? 1 : 0);
  if (participants === 0 || total <= 0) return [];

  const each = Math.floor((total / participants) * 100) / 100;
  const shares = personIds.map((person_id) => ({ person_id, amount: each }));

  if (!includeMe && shares.length > 0) {
    const last = shares[shares.length - 1];
    last.amount = round2(total - each * (shares.length - 1));
  }
  return shares;
}

export const shareInputSchema = z.object({
  person_id: z.string().uuid("Persona inválida"),
  amount: z.number().positive("Cada parte debe ser mayor a 0"),
});

// Valida las partes contra el monto total del gasto y su dueño. Regresa el
// mensaje de error para mostrar, o null si todo cuadra.
export function validateShares(total: number, personId: string | null, shares: ShareInput[]): string | null {
  if (shares.length === 0) return null;

  if (personId !== null) {
    return "Un gasto que es 100% de otra persona no se puede dividir";
  }

  const parsed = z.array(shareInputSchema).safeParse(shares);
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Partes inválidas";

  if (new Set(shares.map((s) => s.person_id)).size !== shares.length) {
    return "Cada persona solo puede aparecer una vez";
  }

  if (sumShares(shares) > total + CENT_EPSILON) {
    return "Las partes suman más que el total del gasto";
  }

  return null;
}

// Llave para los totales de reembolsos: por gasto y por persona. "owner" es
// el dueño del gasto completo (reembolsos con person_id null).
export function reimbursementKey(expenseId: string, personId: string | null): string {
  return `${expenseId}:${personId ?? "owner"}`;
}

// Quién me debe qué de un gasto: el dueño completo (personId null, como
// siempre se ha guardado) o cada persona con su parte si es compartido.
export interface OwedParty {
  personId: string | null; // null = dueño del gasto completo (transactions.person_id)
  name: string;
  amount: number; // total que le toca pagar, sobre el monto del gasto
}

export function owedParties(expense: {
  amount: number;
  person: { name: string } | null;
  shares: ExpenseShare[];
}): OwedParty[] {
  if (expense.person) return [{ personId: null, name: expense.person.name, amount: expense.amount }];
  return expense.shares.map((s) => ({ personId: s.person_id, name: s.person_name, amount: s.amount }));
}

// Parte del gasto que le corresponde a un filtro de persona: "all" = todo el
// gasto (lo que cobra el banco), null = mi parte, o la parte de una persona.
// 0 significa que el gasto no le toca a ese filtro.
export function portionForPerson(
  expense: { amount: number; person_id: string | null; shares: ExpenseShare[] },
  filter: "all" | null | string
): number {
  if (filter === "all") return expense.amount;
  if (filter === null) return myPartOfExpense(expense);
  if (expense.person_id === filter) return expense.amount;
  return expense.shares.find((s) => s.person_id === filter)?.amount ?? 0;
}
