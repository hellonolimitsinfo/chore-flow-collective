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
      const { data, error } = await supabase
        .from('household_members')
        .select(`
          user_id,
          role,
          profiles:profiles!household_members_user_id_fkey(full_name, email)
        `)
        .eq('household_id', householdId);

      if (error) throw error;

      const membersWithProfiles: HouseholdMember[] = (data as any[]).map((member: any) => ({
        user_id: member.user_id,
        role: member.role || 'member',
        full_name: member.profiles?.full_name || null,
        email: member.profiles?.email || ''
      }));

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching household members:', error);
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
