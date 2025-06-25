
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Chore {
  id: string;
  household_id: string;
  name: string;
  frequency: string;
  current_assignee_id: string;
  created_at: string;
  updated_at: string;
  last_completed_at: string | null;
  created_by: string;
  assignee_name?: string;
}

export const useChores = (householdId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChores = async () => {
    if (!householdId || !user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chores')
        .select(`
          *,
          profiles!chores_current_assignee_id_fkey(full_name)
        `)
        .eq('household_id', householdId);

      if (error) throw error;

      const choresWithNames = data?.map(chore => ({
        ...chore,
        assignee_name: chore.profiles?.full_name || 'Unknown'
      })) || [];

      setChores(choresWithNames);
    } catch (error) {
      console.error('Error fetching chores:', error);
      toast({
        title: "Error",
        description: "Failed to load chores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createChore = async (name: string, frequency: string, assigneeId: string) => {
    if (!householdId || !user) return null;

    try {
      const { data, error } = await supabase
        .from('chores')
        .insert({
          household_id: householdId,
          name,
          frequency,
          current_assignee_id: assigneeId,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chore created successfully"
      });

      fetchChores(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error creating chore:', error);
      toast({
        title: "Error",
        description: "Failed to create chore",
        variant: "destructive"
      });
      return null;
    }
  };

  const completeChore = async (choreId: string) => {
    if (!user) return false;

    try {
      // Get the chore details first
      const { data: chore, error: choreError } = await supabase
        .from('chores')
        .select('*')
        .eq('id', choreId)
        .single();

      if (choreError) throw choreError;

      // Get next assignee using the database function
      const { data: nextAssigneeId, error: nextAssigneeError } = await supabase
        .rpc('get_next_chore_assignee', {
          chore_household_id: chore.household_id,
          current_assignee_id: chore.current_assignee_id
        });

      if (nextAssigneeError) throw nextAssigneeError;

      // Record the completion
      const { error: completionError } = await supabase
        .from('chore_completions')
        .insert({
          chore_id: choreId,
          completed_by: user.id,
          next_assignee_id: nextAssigneeId
        });

      if (completionError) throw completionError;

      // Update the chore with new assignee and completion time
      const { error: updateError } = await supabase
        .from('chores')
        .update({
          current_assignee_id: nextAssigneeId,
          last_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', choreId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Chore completed and rotated to next person"
      });

      fetchChores(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error completing chore:', error);
      toast({
        title: "Error",
        description: "Failed to complete chore",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchChores();
  }, [householdId, user]);

  return {
    chores,
    loading,
    createChore,
    completeChore,
    refetch: fetchChores
  };
};
