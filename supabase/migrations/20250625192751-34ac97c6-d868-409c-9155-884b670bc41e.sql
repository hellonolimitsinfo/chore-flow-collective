
-- Create shopping_items table
CREATE TABLE public.shopping_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_low BOOLEAN NOT NULL DEFAULT false,
  flagged_by UUID NULL,
  assigned_to UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT shopping_items_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  CONSTRAINT shopping_items_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT shopping_items_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shopping_items
CREATE POLICY "Users can view shopping items from their households"
ON public.shopping_items FOR SELECT
USING (public.is_household_member(household_id));

CREATE POLICY "Users can insert shopping items to their households"
ON public.shopping_items FOR INSERT
WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "Users can update shopping items in their households"
ON public.shopping_items FOR UPDATE
USING (public.is_household_member(household_id));

CREATE POLICY "Users can delete shopping items from their households"
ON public.shopping_items FOR DELETE
USING (public.is_household_member(household_id));

-- Create index for better performance
CREATE INDEX shopping_items_household_id_idx ON public.shopping_items(household_id);
CREATE INDEX shopping_items_assigned_to_idx ON public.shopping_items(assigned_to);
