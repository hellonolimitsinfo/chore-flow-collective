import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface HouseholdMember {
  user_id: string;
  role: string;
  full_name?: string;
}

interface Household {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  user_role?: string;
  members?: HouseholdMember[];
}

export const useHouseholds = () => {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHouseholds = async () => {
    if (!user) {
      console.log('No user found, skipping household fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching households for user:', user.id);
      
      // Fetch households the user is a member of (RLS will filter automatically)
      const { data: householdsData, error: householdsError } = await supabase
        .from('households')
        .select('*');

      if (householdsError) {
        console.error('Error fetching households:', householdsError);
        toast.error('Failed to fetch households');
        return;
      }

      console.log('Fetched households:', householdsData);

      // Fetch household members with profile information for each household
      const householdsWithDetails = await Promise.all(
        (householdsData || []).map(async (household) => {
          const { data: membersData, error: membersError } = await supabase
            .from('household_members')
            .select(`
              user_id,
              role,
              profiles!inner(full_name)
            `)
            .eq('household_id', household.id);

          if (membersError) {
            console.error('Error fetching members for household:', household.id, membersError);
            return {
              ...household,
              member_count: 0,
              user_role: 'member',
              members: []
            };
          }

          const members = membersData?.map(member => ({
            user_id: member.user_id,
            role: member.role,
            full_name: member.profiles?.full_name
          })) || [];

          const memberCount = members.length;
          const userMember = members.find(member => member.user_id === user.id);
          const userRole = userMember?.role || 'member';

          return {
            ...household,
            member_count: memberCount,
            user_role: userRole,
            members: members
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
    if (!user) {
      console.error('No user found, cannot create household');
      toast.error('You must be logged in to create a household');
      return null;
    }

    try {
      console.log('Creating household with user:', user.id);
      
      // Create the household - the database trigger will automatically add the creator as an admin member
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .insert({
          name,
          description,
          created_by: user.id
        })
        .select()
        .single();

      if (householdError) {
        console.error('Error creating household:', householdError);
        toast.error('Failed to create household');
        return null;
      }

      console.log('Created household:', householdData);
      toast.success('Household created successfully!');
      fetchHouseholds(); // Refresh the list
      return householdData;
    } catch (error) {
      console.error('Error creating household:', error);
      toast.error('Failed to create household');
      return null;
    }
  };

  const deleteHousehold = async (householdId: string) => {
    if (!user) {
      console.error('No user found, cannot delete household');
      toast.error('You must be logged in to delete a household');
      return false;
    }

    try {
      console.log('Attempting to delete household:', householdId);
      
      // First check if the user has permission to delete this household
      const { data: household, error: fetchError } = await supabase
        .from('households')
        .select('created_by')
        .eq('id', householdId)
        .single();

      if (fetchError) {
        console.error('Error fetching household for deletion check:', fetchError);
        toast.error('Failed to verify household permissions');
        return false;
      }

      // Check if user is creator or admin
      const isCreator = household.created_by === user.id;
      let isAdmin = false;

      if (!isCreator) {
        const { data: memberData, error: memberError } = await supabase
          .from('household_members')
          .select('role')
          .eq('household_id', householdId)
          .eq('user_id', user.id)
          .single();

        if (!memberError && memberData?.role === 'admin') {
          isAdmin = true;
        }
      }

      if (!isCreator && !isAdmin) {
        toast.error('You do not have permission to delete this household');
        return false;
      }

      // Perform the deletion
      const { error: deleteError } = await supabase
        .from('households')
        .delete()
        .eq('id', householdId);

      if (deleteError) {
        console.error('Error deleting household:', deleteError);
        toast.error('Failed to delete household: ' + deleteError.message);
        return false;
      }

      console.log('Successfully deleted household:', householdId);
      toast.success('Household deleted successfully!');
      
      // Remove the household from local state immediately for better UX
      setHouseholds(prevHouseholds => 
        prevHouseholds.filter(h => h.id !== householdId)
      );
      
      // Also refresh from server to ensure consistency
      await fetchHouseholds();
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
