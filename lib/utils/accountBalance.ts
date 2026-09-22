// Cálculo del saldo a pagar de una tarjeta de crédito en un periodo dado,
// incluyendo el prorrateo de compras a MSI hechas en periodos anteriores.
import type { TransactionWithRelations } from "@/types";
import { getBillingPeriod, parseYMD, type BillingPeriod } from "@/lib/utils/cardPeriods";

export interface PeriodLineItem {
  transaction: TransactionWithRelations;
  amount: number; // monto que aplica a este periodo: completo, o la cuota MSI correspondiente
  installmentLabel: string | null; // "Cuota 3/12" para gastos a MSI, null si no aplica
}

export interface PeriodBalance {
  total: number;
  items: PeriodLineItem[];
}

// Índice absoluto de mes (year*12+month), usado para contar cuántos cortes
// separan dos periodos sin preocuparse por la duración real de cada mes.
function monthIndex(dateYMD: string): number {
  const [y, m] = dateYMD.split("-").map(Number);
  return y * 12 + m;
}

// Saldo a pagar de un periodo: gastos que tienen una cuota en ese periodo
// (completos si no son MSI, o amount/msi_months si lo son) menos los pagos
// hechos dentro del periodo.
export function calculatePeriodBalance(
  cutOffDay: number,
  paymentDueDay: number,
  period: BillingPeriod,
  allExpenses: TransactionWithRelations[],
  periodPayments: TransactionWithRelations[]
): PeriodBalance {
  const periodMonthIndex = monthIndex(period.end);
  const expenseItems: PeriodLineItem[] = [];

  for (const expense of allExpenses) {
    const purchasePeriod = getBillingPeriod(cutOffDay, paymentDueDay, parseYMD(expense.date));
    const installmentIndex = periodMonthIndex - monthIndex(purchasePeriod.end);

    if (expense.msi_months === 0) {
      if (installmentIndex === 0) {
        expenseItems.push({ transaction: expense, amount: expense.amount, installmentLabel: null });
      }
      continue;
    }

    if (installmentIndex >= 0 && installmentIndex < expense.msi_months) {
      expenseItems.push({
        transaction: expense,
        amount: expense.amount / expense.msi_months,
        installmentLabel: `Cuota ${installmentIndex + 1}/${expense.msi_months}`,
      });
    }
  }

  const paymentItems: PeriodLineItem[] = periodPayments.map((payment) => ({
    transaction: payment,
    amount: -payment.amount,
    installmentLabel: null,
  }));

  const total =
    expenseItems.reduce((sum, item) => sum + item.amount, 0) +
    paymentItems.reduce((sum, item) => sum + item.amount, 0);

  const items = [...expenseItems, ...paymentItems].sort((a, b) =>
    b.transaction.date.localeCompare(a.transaction.date)
  );

  return { total, items };
}

// Offset máximo hacia adelante que tiene sentido navegar: el último periodo
// en el que todavía cae una cuota de MSI pendiente. Sin compras a MSI
// abiertas, no hay hacia dónde avanzar (offset 0).
export function getMaxForwardOffset(
  cutOffDay: number,
  paymentDueDay: number,
  referenceDate: Date,
  allExpenses: TransactionWithRelations[]
): number {
  const baseIndex = monthIndex(getBillingPeriod(cutOffDay, paymentDueDay, referenceDate).end);

  let maxIndex = baseIndex;
  for (const expense of allExpenses) {
    if (expense.msi_months <= 1) continue; // sin MSI: no genera compromisos futuros
    const purchasePeriod = getBillingPeriod(cutOffDay, paymentDueDay, parseYMD(expense.date));
    const lastInstallmentIndex = monthIndex(purchasePeriod.end) + expense.msi_months - 1;
    if (lastInstallmentIndex > maxIndex) maxIndex = lastInstallmentIndex;
  }

  return maxIndex - baseIndex;
}
