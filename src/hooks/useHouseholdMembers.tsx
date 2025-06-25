
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
      
      // Use a single query with proper join to get both member and profile data
      const { data, error } = await supabase
        .from('household_members')
        .select(`
          user_id,
          role,
          profiles!inner(
            full_name,
            email
          )
        `)
        .eq('household_id', householdId);

      if (error) {
        console.error('Error fetching household members:', error);
        throw error;
      }

      console.log('Raw data from query:', data);

      const membersWithProfiles: HouseholdMember[] = (data || []).map((member: any) => ({
        user_id: member.user_id,
        role: member.role || 'member',
        full_name: member.profiles?.full_name || null,
        email: member.profiles?.email || 'Unknown'
      }));

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
