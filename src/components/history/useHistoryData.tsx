
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  id: string;
  type: 'chore' | 'shopping_purchased' | 'shopping_flagged' | 'payment_claimed' | 'payment_confirmed';
  name: string;
  completed_by: string;
  completed_at: string;
  expense_description?: string;
}

export const useHistoryData = (selectedHouseholdId: string | null, isOpen: boolean) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    if (!selectedHouseholdId) {
      setHistoryItems([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch completed chores with user names
      const { data: choreCompletions, error: choreError } = await supabase
        .from('chore_completions')
        .select(`
          id,
          completed_by,
          completed_at,
          chore_id,
          chores!inner(name, household_id),
          profiles!chore_completions_completed_by_fkey(full_name, email)
        `)
        .eq('chores.household_id', selectedHouseholdId)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (choreError) throw choreError;

      // Fetch shopping logs
      const { data: shoppingLogs, error: shoppingError } = await supabase
        .from('shopping_logs')
        .select('id, action, item_name, member_name, created_at')
        .eq('household_id', selectedHouseholdId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (shoppingError) throw shoppingError;

      // Fetch payment logs
      const { data: paymentLogs, error: paymentError } = await supabase
        .from('payment_logs')
        .select('id, member_name, action, expense_description, created_at')
        .eq('household_id', selectedHouseholdId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (paymentError) throw paymentError;

      // Combine and format the data
      const choreHistory: HistoryItem[] = (choreCompletions || []).map(completion => ({
        id: completion.id,
        type: 'chore' as const,
        name: completion.chores.name,
        completed_by: completion.profiles?.full_name || completion.profiles?.email || 'Unknown',
        completed_at: completion.completed_at,
      }));

      const shoppingHistory: HistoryItem[] = (shoppingLogs || []).map(log => ({
        id: log.id,
        type: log.action === 'purchased' ? 'shopping_purchased' as const : 'shopping_flagged' as const,
        name: log.item_name,
        completed_by: log.member_name,
        completed_at: log.created_at,
      }));

      const paymentHistory: HistoryItem[] = (paymentLogs || []).map(log => ({
        id: log.id,
        type: log.action === 'claimed' ? 'payment_claimed' as const : 'payment_confirmed' as const,
        name: log.expense_description,
        completed_by: log.member_name,
        completed_at: log.created_at,
        expense_description: log.expense_description,
      }));

      // Combine and sort by date
      const allHistory = [...choreHistory, ...shoppingHistory, ...paymentHistory]
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

      setHistoryItems(allHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error loading history",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [selectedHouseholdId, isOpen]);

  return { historyItems, loading };
};
