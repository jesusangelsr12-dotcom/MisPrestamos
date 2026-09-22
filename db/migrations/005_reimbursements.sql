-- Reembolsos: pagos que va haciendo la persona dueña de un gasto que no es
-- "Mío" (ej. alguien usó mi tarjeta para una compra a MSI y me va pagando su
-- parte). Independiente del corte de la tarjeta — solo lleva el control de
-- cuánto me ha regresado esa persona por ese gasto en particular.
create table reimbursements (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid not null references transactions(id) on delete cascade,
  amount numeric not null check (amount > 0),
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index reimbursements_expense_idx on reimbursements (expense_id);
