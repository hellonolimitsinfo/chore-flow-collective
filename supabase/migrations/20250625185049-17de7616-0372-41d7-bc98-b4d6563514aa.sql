
-- Add function to remove household members (only admins can remove members)
CREATE OR REPLACE FUNCTION public.remove_household_member(
  p_household_id uuid,
  p_user_id_to_remove uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requesting_user_role text;
BEGIN
  -- Check if the requesting user is an admin of the household
  SELECT role INTO requesting_user_role
  FROM household_members
  WHERE household_id = p_household_id AND user_id = auth.uid();
  
  -- Only allow admins to remove members
  IF requesting_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can remove household members';
  END IF;
  
  -- Don't allow removing yourself
  IF auth.uid() = p_user_id_to_remove THEN
    RAISE EXCEPTION 'Cannot remove yourself from the household';
  END IF;
  
  -- Remove the member
  DELETE FROM household_members
  WHERE household_id = p_household_id AND user_id = p_user_id_to_remove;
  
  RETURN FOUND;
END;
$$;

-- Add RLS policies for household updates (renaming)
CREATE POLICY "Admins can update household details"
ON public.households
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = households.id
    AND user_id = auth.uid()
    AND role = 'admin'
  )
);
