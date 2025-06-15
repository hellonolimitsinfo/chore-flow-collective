
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
      
      // First, fetch households the user is a member of
      const { data: householdsData, error: householdsError } = await supabase
        .from('households')
        .select('*');

      if (householdsError) {
        console.error('Error fetching households:', householdsError);
        toast.error('Failed to fetch households');
        return;
      }

      // Then, fetch household members for each household to get member count and user role
      const householdsWithDetails = await Promise.all(
        (householdsData || []).map(async (household) => {
          const { data: membersData, error: membersError } = await supabase
            .from('household_members')
            .select('user_id, role')
            .eq('household_id', household.id);

          if (membersError) {
            console.error('Error fetching members for household:', household.id, membersError);
            return {
              ...household,
              member_count: 0,
              user_role: 'member'
            };
          }

          const memberCount = membersData?.length || 0;
          const userMember = membersData?.find(member => member.user_id === user.id);
          const userRole = userMember?.role || 'member';

          return {
            ...household,
            member_count: memberCount,
            user_role: userRole
          };
        })
      );

      setHouseholds(householdsWithDetails);
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
