CREATE TABLE payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'msi' | 'loan_given' | 'loan_received'
  entity_id uuid NOT NULL,
  entity_name text NOT NULL, -- description or person name (snapshot)
  month_number integer NOT NULL, -- which month payment (1, 2, 3...)
  amount numeric NOT NULL, -- amount paid that month
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
