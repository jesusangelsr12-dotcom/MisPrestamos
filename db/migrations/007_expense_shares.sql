-- Gastos compartidos: una compra que es en parte mía y en parte de una o más
-- personas (ej. "Salón $150 y yo el resto"). Cada fila es la parte de UNA
-- persona sobre el monto total del gasto; mi parte es lo que sobra
-- (amount - suma de partes), así que no se guarda.
--
-- Convive con transactions.person_id: ese sigue significando "el gasto es
-- 100% de esa persona". Un gasto con partes siempre tiene person_id NULL.
create table expense_shares (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  -- Borrar una persona le regresa su parte a "Mío", igual que person_id
  -- (on delete set null) regresa un gasto completo a "Mío".
  person_id uuid not null references people(id) on delete cascade,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (transaction_id, person_id)
);

create index expense_shares_person_idx on expense_shares (person_id);

-- Reembolsos por persona: en un gasto compartido cada persona va pagando sus
-- propias cuotas. NULL = la persona dueña del gasto completo (person_id del
-- gasto), que es como están todos los reembolsos anteriores a esta migración.
alter table reimbursements
  add column person_id uuid references people(id) on delete cascade;

-- La misma cuota puede estar pagada una vez por cada persona, no una sola vez
-- por gasto.
drop index reimbursements_expense_installment_idx;

create unique index reimbursements_expense_person_installment_idx
  on reimbursements (expense_id, coalesce(person_id, '00000000-0000-0000-0000-000000000000'::uuid), installment_number)
  where installment_number is not null;
