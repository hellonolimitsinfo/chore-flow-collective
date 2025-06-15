
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

      // Fetch household members for each household to get member count and user role
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
    if (!user) {
      console.error('No user found, cannot create household');
      toast.error('You must be logged in to create a household');
      return null;
    }

    try {
      console.log('Creating household with user:', user.id);
      
      // Create the household
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

      // Add the creator as an admin member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: householdData.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) {
        console.error('Error adding user as household member:', memberError);
        // Try to clean up the household if member creation failed
        await supabase
          .from('households')
          .delete()
          .eq('id', householdData.id);
        
        toast.error('Failed to create household membership');
        return null;
      }

      console.log('Successfully added user as admin member');
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
      return false;
    }

    try {
      console.log('Deleting household:', householdId);
      
      const { error } = await supabase
        .from('households')
        .delete()
        .eq('id', householdId);

      if (error) {
        console.error('Error deleting household:', error);
        toast.error('Failed to delete household');
        return false;
      }

      console.log('Successfully deleted household');
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
