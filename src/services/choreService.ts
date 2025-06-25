
import { supabase } from '@/integrations/supabase/client';
import { Chore } from '@/types/chore';

export const choreService = {
  async fetchChores(householdId: string): Promise<Chore[]> {
    const { data, error } = await supabase
      .from('chores')
      .select(`
        *,
        profiles!chores_current_assignee_id_fkey(full_name)
      `)
      .eq('household_id', householdId);

    if (error) throw error;

    return data?.map(chore => ({
      ...chore,
      assignee_name: chore.profiles?.full_name || 'Unknown'
    })) || [];
  },

  async createChore(
    householdId: string, 
    name: string, 
    frequency: string, 
    assigneeId: string, 
    userId: string
  ) {
    const { data, error } = await supabase
      .from('chores')
      .insert({
        household_id: householdId,
        name,
        frequency,
        current_assignee_id: assigneeId,
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completeChore(choreId: string, userId: string): Promise<boolean> {
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
        completed_by: userId,
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
    return true;
  },

  async deleteChore(choreId: string): Promise<boolean> {
    // First delete any related completions
    const { error: completionsError } = await supabase
      .from('chore_completions')
      .delete()
      .eq('chore_id', choreId);

    if (completionsError) throw completionsError;

    // Then delete the chore
    const { error } = await supabase
      .from('chores')
      .delete()
      .eq('id', choreId);

    if (error) throw error;
    return true;
  }
};
