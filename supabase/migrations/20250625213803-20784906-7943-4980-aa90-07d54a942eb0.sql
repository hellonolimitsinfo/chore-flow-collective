
-- Create payment_logs table to track payment actions
CREATE TABLE public.payment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('claimed', 'confirmed')),
  expense_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view payment logs in their households
CREATE POLICY "Users can view payment logs in their households"
ON public.payment_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = payment_logs.household_id
    AND hm.user_id = auth.uid()
  )
);

-- Create policy for users to insert payment logs in their households
CREATE POLICY "Users can create payment logs in their households"
ON public.payment_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = payment_logs.household_id
    AND hm.user_id = auth.uid()
  )
);
