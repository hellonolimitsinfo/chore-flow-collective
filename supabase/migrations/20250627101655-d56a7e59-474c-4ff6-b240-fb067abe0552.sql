
-- Add custom_amounts column to expenses table
ALTER TABLE public.expenses 
ADD COLUMN custom_amounts jsonb NULL;
