-- Add final_payment_amount to msi_expenses
ALTER TABLE msi_expenses
ADD COLUMN has_final_payment boolean NOT NULL DEFAULT false,
ADD COLUMN final_payment_amount numeric;

-- Add months_covered to payment_history (how many months one payment covers)
ALTER TABLE payment_history
ADD COLUMN months_covered integer NOT NULL DEFAULT 1;
