import type { MSIExpense, LoanGiven, LoanReceived } from "@/types";
import { getMSITotalMonths } from "@/lib/utils/finance";

export interface MonthProjection {
  month: Date;
  msiTotal: number;
  loansGivenTotal: number;
  loansReceivedTotal: number;
  total: number;
}

// Parsea 'YYYY-MM-DD' como fecha LOCAL. `new Date("2026-08-01")` la interpreta
// como medianoche UTC, que en zonas UTC-negativas (p. ej. México, UTC-6) cae en
// el día/mes anterior y corría toda la proyección un mes antes.
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

export function calculateMonthlyProjection(
  msiExpenses: MSIExpense[],
  loansGiven: LoanGiven[],
  loansReceived: LoanReceived[],
  months: number = 12
): MonthProjection[] {
  const now = new Date();
  const currentMonth = getMonthStart(now);
  const projections: MonthProjection[] = [];

  for (let i = 0; i < months; i++) {
    const targetMonth = addMonths(currentMonth, i);

    let msiTotal = 0;
    for (const expense of msiExpenses) {
      const total = getMSITotalMonths(expense);
      if (expense.months_paid >= total) continue;

      const startMonth = getMonthStart(parseLocalDate(expense.start_date));
      const firstUnpaidMonth = addMonths(startMonth, expense.months_paid);
      const lastPaymentMonth = addMonths(startMonth, total - 1);

      if (targetMonth >= firstUnpaidMonth && targetMonth <= lastPaymentMonth) {
        const monthNumber =
          (targetMonth.getFullYear() - startMonth.getFullYear()) * 12 +
          (targetMonth.getMonth() - startMonth.getMonth()) + 1;

        // Month (months + 1) is the balloon payment
        if (
          expense.has_final_payment &&
          expense.final_payment_amount &&
          monthNumber === expense.months + 1
        ) {
          msiTotal += expense.final_payment_amount;
        } else {
          msiTotal += expense.monthly_amount;
        }
      }
    }

    let loansGivenTotal = 0;
    for (const loan of loansGiven) {
      if (loan.months_paid >= loan.total_months) continue;
      const startMonth = getMonthStart(parseLocalDate(loan.start_date));
      const firstUnpaidMonth = addMonths(startMonth, loan.months_paid);
      const lastPaymentMonth = addMonths(startMonth, loan.total_months - 1);
      if (targetMonth >= firstUnpaidMonth && targetMonth <= lastPaymentMonth) {
        loansGivenTotal += loan.monthly_payment;
      }
    }

    let loansReceivedTotal = 0;
    for (const loan of loansReceived) {
      if (loan.months_paid >= loan.total_months) continue;
      const startMonth = getMonthStart(parseLocalDate(loan.start_date));
      const firstUnpaidMonth = addMonths(startMonth, loan.months_paid);
      const lastPaymentMonth = addMonths(startMonth, loan.total_months - 1);
      if (targetMonth >= firstUnpaidMonth && targetMonth <= lastPaymentMonth) {
        loansReceivedTotal += loan.monthly_payment;
      }
    }

    projections.push({
      month: targetMonth,
      msiTotal,
      loansGivenTotal,
      loansReceivedTotal,
      total: msiTotal + loansGivenTotal + loansReceivedTotal,
    });
  }

  return projections;
}
