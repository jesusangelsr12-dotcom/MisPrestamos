-- Finanzas personales: cuentas, categorías, personas, transacciones y presupuesto.
-- No altera ninguna tabla existente del módulo de Préstamos (cards, msi_expenses,
-- loans_given, loans_received, payment_history, pin_auth).

-- Cuentas del Home: efectivo, tarjeta de crédito, ahorro, inversión, otros.
-- Independiente de la tabla `cards` (esa sigue siendo solo para el módulo MSI).
create table accounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('cash', 'credit_card', 'savings', 'investment', 'other')),
  cut_off_day integer check (cut_off_day between 1 and 31),
  payment_due_day integer check (payment_due_day between 1 and 31),
  created_at timestamptz not null default now(),
  -- Corte y límite de pago solo aplican (y son obligatorios) para tarjetas de crédito.
  constraint accounts_credit_card_dates check (
    (type = 'credit_card' and cut_off_day is not null and payment_due_day is not null)
    or
    (type <> 'credit_card' and cut_off_day is null and payment_due_day is null)
  )
);

-- Categorías de gasto, agregables desde el formulario de gasto.
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Personas para etiquetar de quién es un gasto, agregables.
-- "Mío" no se siembra como fila: person_id NULL en transactions representa "Mío"
-- por default, evitando datos semilla y una fila especial que habría que proteger de borrado.
create table people (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Movimientos del botón "+": gasto, pago/ingreso a tarjeta, transferencia entre cuentas.
-- Una sola tabla ancha (no 3 tablas) porque el detalle de cuenta y el periodo necesitan
-- leerlos juntos, ordenados por fecha.
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('expense', 'payment', 'transfer')),
  date date not null,
  amount numeric not null check (amount > 0),
  -- expense: cuenta con la que se pagó · payment: tarjeta que se abona · transfer: cuenta destino
  account_id uuid not null references accounts(id) on delete restrict,
  -- payment: cuenta de origen del dinero · transfer: cuenta origen · expense: siempre null
  source_account_id uuid references accounts(id) on delete restrict,
  category_id uuid references categories(id) on delete set null,
  person_id uuid references people(id) on delete set null,
  note text,
  msi_months integer not null default 0 check (msi_months in (0, 3, 6, 9, 12, 18, 24, 36)),
  created_at timestamptz not null default now(),
  constraint transactions_distinct_accounts check (
    source_account_id is null or source_account_id <> account_id
  ),
  constraint transactions_payment_transfer_source check (
    (type = 'expense' and source_account_id is null)
    or
    (type in ('payment', 'transfer') and source_account_id is not null)
  ),
  -- MSI y persona solo tienen sentido para gastos.
  constraint transactions_expense_only_fields check (
    type = 'expense' or (msi_months = 0 and person_id is null)
  )
);

create index transactions_account_date_idx on transactions (account_id, date);
create index transactions_account_type_idx on transactions (account_id, type);
create index transactions_source_account_idx on transactions (source_account_id);

-- Presupuesto mensual por categoría (no un total global).
create table budgets (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references categories(id) on delete cascade,
  month date not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now(),
  constraint budgets_month_is_first_of_month check (extract(day from month) = 1),
  unique (category_id, month)
);
