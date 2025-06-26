
-- Create expense_history table to store settled expenses
CREATE TABLE public.expense_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid NOT NULL,
  original_expense_id uuid NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  paid_by text NOT NULL,
  split_type text NOT NULL,
  owed_by text[] NOT NULL DEFAULT '{}',
  bank_details text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  settled_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.expense_history ENABLE ROW LEVEL SECURITY;

-- Create policy for household members to view expense history
CREATE POLICY "Users can view expense history for their households"
  ON public.expense_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = expense_history.household_id
      AND user_id = auth.uid()
    )
  );

-- Create policy for household members to insert expense history
CREATE POLICY "Users can insert expense history for their households"
  ON public.expense_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = expense_history.household_id
      AND user_id = auth.uid()
    )
  );
