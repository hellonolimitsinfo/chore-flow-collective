import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Household, HouseholdMember } from '@/types/household';

export const fetchHouseholdsFromDB = async (userId: string): Promise<Household[]> => {
  console.log('Fetching households for user:', userId);
  
  // Fetch households the user is a member of (RLS will filter automatically)
  const { data: householdsData, error: householdsError } = await supabase
    .from('households')
    .select('*');

  if (householdsError) {
    console.error('Error fetching households:', householdsError);
    toast.error('Failed to fetch households');
    return [];
  }

  console.log('Fetched households:', householdsData);

  // Fetch household members and their profile information for each household
  const householdsWithDetails = await Promise.all(
    (householdsData || []).map(async (household) => {
      // First, get the household members
      const { data: membersData, error: membersError } = await supabase
        .from('household_members')
        .select('user_id, role')
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

      // Then, get the profile information for each member
      const members: HouseholdMember[] = [];
      
      for (const member of membersData || []) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', member.user_id)
          .single();

        members.push({
          user_id: member.user_id,
          role: member.role,
          full_name: profileError ? undefined : profileData?.full_name
        });
      }

      const memberCount = members.length;
      const userMember = members.find(member => member.user_id === userId);
      const userRole = userMember?.role || 'member';

      return {
        ...household,
        member_count: memberCount,
        user_role: userRole,
        members: members
      };
    })
  );

  return householdsWithDetails;
};

export const createHouseholdInDB = async (userId: string, name: string, description?: string): Promise<Household | null> => {
  console.log('Creating household with user:', userId);
  
  // Create the household - the database trigger will automatically add the creator as an admin member
  const { data: householdData, error: householdError } = await supabase
    .from('households')
    .insert({
      name,
      description,
      created_by: userId
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
  return householdData;
};

export const renameHouseholdInDB = async (householdId: string, newName: string): Promise<boolean> => {
  console.log('Renaming household:', householdId, 'to:', newName);
  
  const { error } = await supabase
    .from('households')
    .update({ name: newName, updated_at: new Date().toISOString() })
    .eq('id', householdId);

  if (error) {
    console.error('Error renaming household:', error);
    toast.error('Failed to rename household: ' + error.message);
    return false;
  }

  console.log('Successfully renamed household:', householdId);
  toast.success('Household renamed successfully!');
  return true;
};

export const removeMemberFromHousehold = async (householdId: string, userId: string): Promise<boolean> => {
  console.log('Removing member from household:', householdId, 'user:', userId);
  
  const { data, error } = await supabase.rpc('remove_household_member', {
    p_household_id: householdId,
    p_user_id_to_remove: userId
  });

  if (error) {
    console.error('Error removing household member:', error);
    toast.error('Failed to remove member: ' + error.message);
    return false;
  }

  console.log('Successfully removed household member:', userId);
  toast.success('Member removed successfully!');
  return true;
};

export const deleteHouseholdFromDB = async (userId: string, householdId: string): Promise<boolean> => {
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
  const isCreator = household.created_by === userId;
  let isAdmin = false;

  if (!isCreator) {
    const { data: memberData, error: memberError } = await supabase
      .from('household_members')
      .select('role')
      .eq('household_id', householdId)
      .eq('user_id', userId)
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
  return true;
};
