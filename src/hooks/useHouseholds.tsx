
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Household {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  user_role?: string;
}

export const useHouseholds = () => {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHouseholds = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch households with member count and user role
      const { data, error } = await supabase
        .from('households')
        .select(`
          *,
          household_members!inner(role),
          household_members(count)
        `);

      if (error) {
        console.error('Error fetching households:', error);
        toast.error('Failed to fetch households');
        return;
      }

      // Process the data to get member count and user role
      const processedHouseholds = data?.map(household => ({
        ...household,
        member_count: household.household_members?.length || 0,
        user_role: household.household_members?.[0]?.role || 'member'
      })) || [];

      setHouseholds(processedHouseholds);
    } catch (error) {
      console.error('Error fetching households:', error);
      toast.error('Failed to fetch households');
    } finally {
      setLoading(false);
    }
  };

  const createHousehold = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('households')
        .insert({
          name,
          description,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating household:', error);
        toast.error('Failed to create household');
        return null;
      }

      toast.success('Household created successfully!');
      fetchHouseholds(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error creating household:', error);
      toast.error('Failed to create household');
      return null;
    }
  };

  const deleteHousehold = async (householdId: string) => {
    try {
      const { error } = await supabase
        .from('households')
        .delete()
        .eq('id', householdId);

      if (error) {
        console.error('Error deleting household:', error);
        toast.error('Failed to delete household');
        return false;
      }

      toast.success('Household deleted successfully!');
      fetchHouseholds(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error deleting household:', error);
      toast.error('Failed to delete household');
      return false;
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, [user]);

  return {
    households,
    loading,
    createHousehold,
    deleteHousehold,
    refetch: fetchHouseholds
  };
};
