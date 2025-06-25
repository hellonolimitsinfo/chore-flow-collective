
-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_by TEXT NOT NULL,
  split_type TEXT NOT NULL CHECK (split_type IN ('equal', 'individual')),
  owed_by TEXT[] NOT NULL DEFAULT '{}',
  bank_details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view expenses in their households
CREATE POLICY "Users can view expenses in their households"
ON public.expenses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = expenses.household_id
    AND hm.user_id = auth.uid()
  )
);

-- Create policy for users to insert expenses in their households
CREATE POLICY "Users can create expenses in their households"
ON public.expenses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = expenses.household_id
    AND hm.user_id = auth.uid()
  )
);

-- Create policy for users to update expenses in their households
CREATE POLICY "Users can update expenses in their households"
ON public.expenses
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = expenses.household_id
    AND hm.user_id = auth.uid()
  )
);

-- Create policy for users to delete expenses in their households
CREATE POLICY "Users can delete expenses in their households"
ON public.expenses
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = expenses.household_id
    AND hm.user_id = auth.uid()
  )
);
