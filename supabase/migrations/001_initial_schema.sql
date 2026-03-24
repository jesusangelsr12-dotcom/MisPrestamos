-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Cards table
create table cards (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  bank text not null,
  color text not null,
  last_four text not null check (length(last_four) = 4),
  created_at timestamptz not null default now()
);

-- MSI Expenses table
create table msi_expenses (
  id uuid primary key default uuid_generate_v4(),
  card_id uuid not null references cards(id) on delete cascade,
  description text not null,
  total_amount numeric not null check (total_amount > 0),
  monthly_amount numeric not null check (monthly_amount > 0),
  months integer not null check (months > 0),
  months_paid integer not null default 0 check (months_paid >= 0),
  start_date date not null,
  owner text not null check (owner in ('me', 'other')),
  owner_name text,
  created_at timestamptz not null default now()
);

-- Loans Given table (préstamos que hago a otros)
create table loans_given (
  id uuid primary key default uuid_generate_v4(),
  borrower_name text not null,
  amount numeric not null check (amount > 0),
  monthly_payment numeric not null check (monthly_payment > 0),
  total_months integer not null check (total_months > 0),
  months_paid integer not null default 0 check (months_paid >= 0),
  start_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

-- Loans Received table (préstamos que me hacen)
create table loans_received (
  id uuid primary key default uuid_generate_v4(),
  lender_name text not null,
  amount numeric not null check (amount > 0),
  monthly_payment numeric not null check (monthly_payment > 0),
  total_months integer not null check (total_months > 0),
  months_paid integer not null default 0 check (months_paid >= 0),
  start_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

-- PIN Auth table
create table pin_auth (
  id uuid primary key default uuid_generate_v4(),
  hashed_pin text not null,
  created_at timestamptz not null default now()
);
