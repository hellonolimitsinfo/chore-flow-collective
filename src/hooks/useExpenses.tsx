import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  household_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_type: 'equal' | 'individual';
  owed_by: string[];
  bank_details: string;
  created_at: string;
  updated_at: string;
  custom_amounts?: Record<string, number>;
}

interface CreateExpenseData {
  household_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_type: 'equal' | 'individual';
  owed_by: string[];
  bank_details: string;
  custom_amounts?: Record<string, number>;
}

export const useExpenses = (householdId: string | null) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchExpenses = async () => {
    if (!householdId) {
      setExpenses([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        toast({
          title: "Error",
          description: "Failed to fetch expenses",
          variant: "destructive",
        });
        return;
      }

      // Type assertion and conversion to ensure proper typing
      const typedExpenses = (data || []).map(expense => ({
        ...expense,
        split_type: expense.split_type as 'equal' | 'individual',
        custom_amounts: expense.custom_amounts ? expense.custom_amounts as Record<string, number> : undefined
      }));

      setExpenses(typedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expenseData: CreateExpenseData) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select()
        .single();

      if (error) {
        console.error('Error adding expense:', error);
        toast({
          title: "Error",
          description: "Failed to add expense",
          variant: "destructive",
        });
        return null;
      }

      // Type assertion for the returned data with proper custom_amounts conversion
      const typedExpense = {
        ...data,
        split_type: data.split_type as 'equal' | 'individual',
        custom_amounts: data.custom_amounts ? data.custom_amounts as Record<string, number> : undefined
      };

      setExpenses(prev => [typedExpense, ...prev]);
      toast({
        title: "Expense added! 💰",
        description: `${expenseData.description} has been added to expenses.`,
      });
      
      return typedExpense;
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.error('Error deleting expense:', error);
        toast({
          title: "Error",
          description: "Failed to delete expense",
          variant: "destructive",
        });
        return;
      }

      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      toast({
        title: "Expense deleted",
        description: "The expense has been removed from the list.",
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [householdId]);

  return {
    expenses,
    loading,
    addExpense,
    deleteExpense,
    refetchExpenses: fetchExpenses,
  };
};
