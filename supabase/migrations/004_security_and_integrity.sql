-- =============================================================================
-- 004_security_and_integrity.sql
-- Closes the critical security hole (anon key had full read/write access to all
-- financial data and the PIN hash) and fixes data-integrity bugs in the
-- mark-paid flow.
-- =============================================================================

-- 1. Row Level Security ------------------------------------------------------
-- Enable (and force) RLS on every table. No policies are created, so the public
-- `anon` and `authenticated` roles are denied ALL access. Only the server's
-- `service_role` key (which has BYPASSRLS) can read or write — and that key
-- never reaches the browser.
alter table cards            enable row level security;
alter table msi_expenses     enable row level security;
alter table loans_given      enable row level security;
alter table loans_received   enable row level security;
alter table payment_history  enable row level security;
alter table pin_auth         enable row level security;

alter table cards            force row level security;
alter table msi_expenses     force row level security;
alter table loans_given      force row level security;
alter table loans_received   force row level security;
alter table payment_history  force row level security;
alter table pin_auth         force row level security;

-- 2. Server-side PIN brute-force lockout -------------------------------------
alter table pin_auth
  add column if not exists failed_attempts integer not null default 0,
  add column if not exists locked_until timestamptz;

-- 3. Atomic "mark month(s) paid" --------------------------------------------
-- These functions replace the previous read-modify-write in application code,
-- which lost updates under concurrency and silently swallowed payment_history
-- insert errors. Each function locks the target row (FOR UPDATE), advances
-- months_paid by the clamped amount, and writes ONE payment_history row per
-- covered month — all in a single transaction. The paid amount is split evenly
-- across the covered months with any rounding remainder on the last row, so the
-- recorded amounts always sum back to the amount the user entered.

create or replace function mark_msi_paid(
  p_id uuid,
  p_months_covered integer,
  p_amount numeric
)
returns msi_expenses
language plpgsql
as $$
declare
  v_row msi_expenses;
  v_total_months integer;
  v_apply integer;
  v_base integer;
  v_per numeric;
  v_remainder numeric;
  i integer;
  v_month_amount numeric;
begin
  select * into v_row from msi_expenses where id = p_id for update;
  if not found then
    raise exception 'Gasto MSI no encontrado';
  end if;

  v_total_months := case when v_row.has_final_payment then v_row.months + 1 else v_row.months end;
  if v_row.months_paid >= v_total_months then
    raise exception 'Este gasto ya está completado';
  end if;

  if p_months_covered < 1 then
    p_months_covered := 1;
  end if;
  v_apply := least(p_months_covered, v_total_months - v_row.months_paid);
  v_base := v_row.months_paid; -- months already paid before this call

  update msi_expenses
    set months_paid = v_base + v_apply
    where id = p_id
    returning * into v_row;

  v_per := round(p_amount / v_apply, 2);
  v_remainder := p_amount - (v_per * v_apply);
  for i in 1..v_apply loop
    v_month_amount := case when i = v_apply then v_per + v_remainder else v_per end;
    insert into payment_history
      (entity_type, entity_id, entity_name, month_number, amount, months_covered)
    values
      ('msi', p_id, v_row.description, v_base + i, v_month_amount, 1);
  end loop;

  return v_row;
end;
$$;

create or replace function mark_loan_given_paid(
  p_id uuid,
  p_months_covered integer,
  p_amount numeric
)
returns loans_given
language plpgsql
as $$
declare
  v_row loans_given;
  v_apply integer;
  v_base integer;
  v_per numeric;
  v_remainder numeric;
  i integer;
  v_month_amount numeric;
begin
  select * into v_row from loans_given where id = p_id for update;
  if not found then
    raise exception 'Préstamo no encontrado';
  end if;

  if v_row.months_paid >= v_row.total_months then
    raise exception 'Este préstamo ya está completado';
  end if;

  if p_months_covered < 1 then
    p_months_covered := 1;
  end if;
  v_apply := least(p_months_covered, v_row.total_months - v_row.months_paid);
  v_base := v_row.months_paid;

  update loans_given
    set months_paid = v_base + v_apply
    where id = p_id
    returning * into v_row;

  v_per := round(p_amount / v_apply, 2);
  v_remainder := p_amount - (v_per * v_apply);
  for i in 1..v_apply loop
    v_month_amount := case when i = v_apply then v_per + v_remainder else v_per end;
    insert into payment_history
      (entity_type, entity_id, entity_name, month_number, amount, months_covered)
    values
      ('loan_given', p_id, v_row.borrower_name, v_base + i, v_month_amount, 1);
  end loop;

  return v_row;
end;
$$;

create or replace function mark_loan_received_paid(
  p_id uuid,
  p_months_covered integer,
  p_amount numeric
)
returns loans_received
language plpgsql
as $$
declare
  v_row loans_received;
  v_apply integer;
  v_base integer;
  v_per numeric;
  v_remainder numeric;
  i integer;
  v_month_amount numeric;
begin
  select * into v_row from loans_received where id = p_id for update;
  if not found then
    raise exception 'Préstamo no encontrado';
  end if;

  if v_row.months_paid >= v_row.total_months then
    raise exception 'Este préstamo ya está completado';
  end if;

  if p_months_covered < 1 then
    p_months_covered := 1;
  end if;
  v_apply := least(p_months_covered, v_row.total_months - v_row.months_paid);
  v_base := v_row.months_paid;

  update loans_received
    set months_paid = v_base + v_apply
    where id = p_id
    returning * into v_row;

  v_per := round(p_amount / v_apply, 2);
  v_remainder := p_amount - (v_per * v_apply);
  for i in 1..v_apply loop
    v_month_amount := case when i = v_apply then v_per + v_remainder else v_per end;
    insert into payment_history
      (entity_type, entity_id, entity_name, month_number, amount, months_covered)
    values
      ('loan_received', p_id, v_row.lender_name, v_base + i, v_month_amount, 1);
  end loop;

  return v_row;
end;
$$;
