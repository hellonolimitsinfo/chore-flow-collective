
-- Create shopping_items table
CREATE TABLE public.shopping_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  quantity INTEGER DEFAULT 1,
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shopping_items
CREATE POLICY "Users can view shopping items from their households" 
  ON public.shopping_items 
  FOR SELECT 
  USING (public.is_household_member(household_id));

CREATE POLICY "Users can insert shopping items to their households" 
  ON public.shopping_items 
  FOR INSERT 
  WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "Users can update shopping items from their households" 
  ON public.shopping_items 
  FOR UPDATE 
  USING (public.is_household_member(household_id));

CREATE POLICY "Users can delete shopping items from their households" 
  ON public.shopping_items 
  FOR DELETE 
  USING (public.is_household_member(household_id));

-- Create indexes for better performance
CREATE INDEX idx_shopping_items_household_id ON public.shopping_items(household_id);
CREATE INDEX idx_shopping_items_created_at ON public.shopping_items(created_at);
