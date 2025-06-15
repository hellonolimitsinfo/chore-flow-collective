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
      console.log('Fetching households for user:', user.id);
      
      // Fetch households with member details using the fixed RLS policies
      const { data: householdsData, error: householdsError } = await supabase
        .from('households')
        .select(`
          *,
          household_members(user_id, role)
        `);

      if (householdsError) {
        console.error('Error fetching households:', householdsError);
        toast.error('Failed to fetch households');
        return;
      }

      console.log('Fetched households data:', householdsData);

      // Process the data to get member count and user role
      const processedHouseholds = (householdsData || []).map(household => {
        const members = household.household_members || [];
        const memberCount = members.length;
        const userMember = members.find(member => member.user_id === user.id);
        const userRole = userMember?.role || 'member';

        return {
          ...household,
          member_count: memberCount,
          user_role: userRole
        };
      });

      console.log('Processed households:', processedHouseholds);
      setHouseholds(processedHouseholds);
    } catch (error) {
      console.error('Error fetching households:', error);
      toast.error('Failed to fetch households');
    } finally {
      setLoading(false);
    }
  };

  const createHousehold = async (name: string, description?: string) => {
    if (!user) {
      console.error('No user found when trying to create household');
      return null;
    }

    try {
      console.log('Creating household with user ID:', user.id);
      console.log('Household data:', { name, description });
      
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
        toast.error(`Failed to create household: ${error.message}`);
        return null;
      }

      console.log('Successfully created household:', data);
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
