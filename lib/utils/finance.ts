import type { MSIExpense, LoanGiven, LoanReceived } from "@/types";

export function calculateMonthlyPayment(total: number, months: number): number {
  if (months <= 0) return 0;
  return total / months;
}

export function calculateRemainingAmount(
  monthlyAmount: number,
  monthsRemaining: number
): number {
  if (monthsRemaining <= 0) return 0;
  return monthlyAmount * monthsRemaining;
}

function getMSITotalMonths(e: MSIExpense): number {
  return e.has_final_payment ? e.months + 1 : e.months;
}

function getMSICurrentMonthAmount(e: MSIExpense): number {
  if (e.has_final_payment && e.months_paid === e.months && e.final_payment_amount) {
    return e.final_payment_amount;
  }
  return e.monthly_amount;
}

export function calculateTotalMonthlyDue(
  expenses: MSIExpense[],
  loansGiven: LoanGiven[],
  loansReceived: LoanReceived[]
): number {
  const activeExpenses = expenses
    .filter((e) => e.months_paid < getMSITotalMonths(e))
    .reduce((sum, e) => sum + getMSICurrentMonthAmount(e), 0);

  const activeLoansGiven = loansGiven
    .filter((l) => l.months_paid < l.total_months)
    .reduce((sum, l) => sum + l.monthly_payment, 0);

  const activeLoansReceived = loansReceived
    .filter((l) => l.months_paid < l.total_months)
    .reduce((sum, l) => sum + l.monthly_payment, 0);

  return activeExpenses + activeLoansGiven + activeLoansReceived;
}

export function isExpenseActive(
  _startDate: string,
  months: number,
  monthsPaid: number,
  hasFinalPayment: boolean = false
): boolean {
  const total = hasFinalPayment ? months + 1 : months;
  return monthsPaid < total;
}
