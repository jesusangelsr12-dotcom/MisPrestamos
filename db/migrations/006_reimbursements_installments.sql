-- Reinventa el registro de reembolsos de MSI: en vez de montos libres, cada
-- reembolso ahora corresponde a una cuota (1..msi_months) de la compra. Se
-- marca pagada con un solo toque (la fecha es el día del toque) y el índice
-- único evita que la misma cuota se registre dos veces por error.
alter table reimbursements add column installment_number integer check (installment_number is null or installment_number > 0);

create unique index reimbursements_expense_installment_idx on reimbursements (expense_id, installment_number) where installment_number is not null;
