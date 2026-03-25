import type { MSIExpense, LoanGiven, LoanReceived } from "@/types";

export interface MonthProjection {
  month: Date;
  msiTotal: number;
  loansGivenTotal: number;
  loansReceivedTotal: number;
  total: number;
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
      if (expense.months_paid >= expense.months) continue;

      const startMonth = getMonthStart(new Date(expense.start_date));
      // The first unpaid month is start + months_paid
      const firstUnpaidMonth = addMonths(startMonth, expense.months_paid);
      // The last payment month is start + months - 1
      const lastPaymentMonth = addMonths(startMonth, expense.months - 1);

      if (targetMonth >= firstUnpaidMonth && targetMonth <= lastPaymentMonth) {
        msiTotal += expense.monthly_amount;
      }
    }

    let loansGivenTotal = 0;
    for (const loan of loansGiven) {
      if (loan.months_paid >= loan.total_months) continue;

      const startMonth = getMonthStart(new Date(loan.start_date));
      const firstUnpaidMonth = addMonths(startMonth, loan.months_paid);
      const lastPaymentMonth = addMonths(startMonth, loan.total_months - 1);

      if (targetMonth >= firstUnpaidMonth && targetMonth <= lastPaymentMonth) {
        loansGivenTotal += loan.monthly_payment;
      }
    }

    let loansReceivedTotal = 0;
    for (const loan of loansReceived) {
      if (loan.months_paid >= loan.total_months) continue;

      const startMonth = getMonthStart(new Date(loan.start_date));
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
