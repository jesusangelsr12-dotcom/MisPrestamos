import type { MSIExpense, LoanGiven, LoanReceived } from "@/types";

/**
 * Calculates the monthly payment for a given total amount over a number of months.
 * @param total - The total amount to divide
 * @param months - The number of months to divide over
 * @returns The monthly payment amount
 */
export function calculateMonthlyPayment(total: number, months: number): number {
  if (months <= 0) return 0;
  return total / months;
}

/**
 * Calculates the remaining amount based on monthly payment and months remaining.
 * @param monthlyAmount - The amount paid per month
 * @param monthsRemaining - The number of months remaining
 * @returns The total remaining amount
 */
export function calculateRemainingAmount(
  monthlyAmount: number,
  monthsRemaining: number
): number {
  if (monthsRemaining <= 0) return 0;
  return monthlyAmount * monthsRemaining;
}

/**
 * Calculates the total monthly amount due across all active MSI expenses and loans.
 * Only includes items where months_paid < total months (active items).
 * @param expenses - Array of MSI expenses
 * @param loansGiven - Array of loans given to others
 * @param loansReceived - Array of loans received from others
 * @returns The total monthly amount due
 */
export function calculateTotalMonthlyDue(
  expenses: MSIExpense[],
  loansGiven: LoanGiven[],
  loansReceived: LoanReceived[]
): number {
  const activeExpenses = expenses
    .filter((e) => e.months_paid < e.months)
    .reduce((sum, e) => sum + e.monthly_amount, 0);

  const activeLoansGiven = loansGiven
    .filter((l) => l.months_paid < l.total_months)
    .reduce((sum, l) => sum + l.monthly_payment, 0);

  const activeLoansReceived = loansReceived
    .filter((l) => l.months_paid < l.total_months)
    .reduce((sum, l) => sum + l.monthly_payment, 0);

  return activeExpenses + activeLoansGiven + activeLoansReceived;
}

/**
 * Determines whether an expense or loan is still active.
 * An item is active if months_paid is less than the total months.
 * @param _startDate - The start date of the expense (reserved for future use)
 * @param months - The total number of months
 * @param monthsPaid - The number of months already paid
 * @returns True if the expense is still active
 */
export function isExpenseActive(
  _startDate: string,
  months: number,
  monthsPaid: number
): boolean {
  return monthsPaid < months;
}
