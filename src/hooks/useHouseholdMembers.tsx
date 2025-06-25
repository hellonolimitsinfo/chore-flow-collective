
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HouseholdMember {
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
}

export const useHouseholdMembers = (householdId: string | null) => {
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = async () => {
    if (!householdId) return;

    try {
      setLoading(true);
      console.log('Fetching members for household:', householdId);
      
      // First get household members
      const { data: householdMembers, error: membersError } = await supabase
        .from('household_members')
        .select('user_id, role')
        .eq('household_id', householdId);

      if (membersError) {
        console.error('Error fetching household members:', membersError);
        throw membersError;
      }

      console.log('Household members:', householdMembers);

      // Then get profile data for each member
      const membersWithProfiles: HouseholdMember[] = [];
      
      for (const member of householdMembers || []) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', member.user_id)
          .single();

        if (profileError) {
          console.error('Error fetching profile for user:', member.user_id, profileError);
          // Continue with partial data
          membersWithProfiles.push({
            user_id: member.user_id,
            role: member.role || 'member',
            full_name: null,
            email: 'Unknown'
          });
        } else {
          membersWithProfiles.push({
            user_id: member.user_id,
            role: member.role || 'member',
            full_name: profile?.full_name || null,
            email: profile?.email || 'Unknown'
          });
        }
      }

      console.log('Members with profiles:', membersWithProfiles);
      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching household members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [householdId]);

  return {
    members,
    loading,
    refetch: fetchMembers
  };
};
