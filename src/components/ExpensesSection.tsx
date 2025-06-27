import { useState, useEffect } from "react";
import { Plus, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useExpenses } from "@/hooks/useExpenses";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AddExpenseForm } from "./expenses/AddExpenseForm";
import { ExpensesList } from "./expenses/ExpensesList";
import { SettledExpensesSection } from "./expenses/SettledExpensesSection";

interface ExpensesSectionProps {
  selectedHouseholdId: string | null;
}

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

type PaymentState = 'pending' | 'claimed' | 'confirmed';

export const ExpensesSection = ({ selectedHouseholdId }: ExpensesSectionProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { expenses, loading, addExpense, deleteExpense, refetchExpenses } = useExpenses(selectedHouseholdId);
  const { members } = useHouseholdMembers(selectedHouseholdId);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [paymentStates, setPaymentStates] = useState<Record<string, Record<string, PaymentState>>>({});
  const [settledExpensesOpen, setSettledExpensesOpen] = useState(false);

  // Real-time subscription for payment logs
  useEffect(() => {
    if (!selectedHouseholdId) return;

    const channel = supabase
      .channel('payment-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_logs',
          filter: `household_id=eq.${selectedHouseholdId}`
        },
        () => {
          refetchExpenses();
          fetchPaymentStates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedHouseholdId, refetchExpenses]);

  // Fetch payment states from payment logs
  const fetchPaymentStates = async () => {
    if (!selectedHouseholdId) return;

    try {
      const { data: paymentLogs, error } = await supabase
        .from('payment_logs')
        .select('expense_id, member_name, action')
        .eq('household_id', selectedHouseholdId);

      if (error) throw error;

      const states: Record<string, Record<string, PaymentState>> = {};
      
      paymentLogs?.forEach(log => {
        if (!states[log.expense_id]) {
          states[log.expense_id] = {};
        }
        
        if (log.action === 'claimed') {
          states[log.expense_id][log.member_name] = 'claimed';
        } else if (log.action === 'confirmed') {
          states[log.expense_id][log.member_name] = 'confirmed';
        }
      });

      setPaymentStates(states);
    } catch (error) {
      console.error('Error fetching payment states:', error);
    }
  };

  useEffect(() => {
    fetchPaymentStates();
  }, [selectedHouseholdId, expenses]);

  const addExampleExpenses = async () => {
    if (!selectedHouseholdId || !members.length) return;

    const memberNames = members.map(m => m.full_name || m.email);
    const examples = [
      {
        description: "Groceries - Weekly Shop",
        amount: 85.50,
        paid_by: memberNames[0] || "Someone",
        split_type: 'equal' as const,
        owed_by: memberNames,
        bank_details: "Santander *1234"
      },
      {
        description: "Electricity Bill",
        amount: 120.00,
        paid_by: memberNames[1] || memberNames[0] || "Someone",
        split_type: 'equal' as const,
        owed_by: memberNames,
        bank_details: "Monzo *5678"
      }
    ];

    for (const example of examples) {
      await addExpense({
        household_id: selectedHouseholdId,
        ...example
      });
    }
  };

  const getPaymentState = (expenseId: string, memberName: string, expense: Expense): PaymentState => {
    // If this person paid the expense, they're automatically confirmed
    if (memberName === expense.paid_by) {
      return 'confirmed';
    }
    return paymentStates[expenseId]?.[memberName] || 'pending';
  };

  const isExpenseFullySettled = (expense: Expense) => {
    return expense.owed_by.every(person => 
      getPaymentState(expense.id, person, expense) === 'confirmed'
    );
  };

  const activeExpenses = expenses.filter(expense => !isExpenseFullySettled(expense));
  const settledExpenses = expenses.filter(expense => isExpenseFullySettled(expense));

  const currentUserName = members.find(m => m.user_id === user?.id)?.full_name || 
                         members.find(m => m.user_id === user?.id)?.email || 
                         'Unknown';

  const handleClaimPayment = async (expense: Expense, memberName: string) => {
    if (!user || !selectedHouseholdId) return;

    try {
      const { error } = await supabase
        .from('payment_logs')
        .insert([{
          household_id: selectedHouseholdId,
          expense_id: expense.id,
          member_name: memberName,
          action: 'claimed',
          expense_description: expense.description
        }]);

      if (error) throw error;

      toast({
        title: "Payment claimed! 💰",
        description: `${memberName} says they've paid for ${expense.description}`,
      });

      fetchPaymentStates();
    } catch (error) {
      console.error('Error claiming payment:', error);
      toast({
        title: "Error",
        description: "Failed to claim payment",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPayment = async (expense: Expense, memberName: string) => {
    if (!user || !selectedHouseholdId) return;

    try {
      const { error } = await supabase
        .from('payment_logs')
        .insert([{
          household_id: selectedHouseholdId,
          expense_id: expense.id,
          member_name: memberName,
          action: 'confirmed',
          expense_description: expense.description
        }]);

      if (error) throw error;

      toast({
        title: "Payment confirmed! ✅",
        description: `${memberName}'s payment for ${expense.description} has been confirmed`,
      });

      // Fix: Manually compute updated states before checking if all confirmed
      const updatedStates = {
        ...paymentStates,
        [expense.id]: {
          ...(paymentStates[expense.id] || {}),
          [memberName]: 'confirmed' as PaymentState
        }
      };

      // Check if all people (including the payer) are confirmed
      const allConfirmed = expense.owed_by.every(person => {
        if (person === expense.paid_by) {
          return true; // Payer is automatically confirmed
        }
        return updatedStates[expense.id][person] === 'confirmed';
      });

      if (allConfirmed) {
        toast({
          title: "Expense fully settled! 🎉",
          description: `All payments for ${expense.description} have been confirmed`,
        });
      }

      // Force refetch to ensure UI updates
      await refetchExpenses();
      fetchPaymentStates();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive",
      });
    }
  };

  if (!selectedHouseholdId) {
    return (
      <Card className="bg-gray-800/80 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Select a household to view expenses</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800/80 border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Expenses
            </CardTitle>
            <Button
              onClick={() => setIsAddingExpense(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeExpenses.length === 0 && settledExpenses.length === 0 && (
            <Button
              onClick={addExampleExpenses}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Add Examples
            </Button>
          )}

          {loading ? (
            <div className="text-gray-400 text-center py-4">
              {t('loading')}
            </div>
          ) : activeExpenses.length === 0 && settledExpenses.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              No expenses yet. Add your first expense!
            </div>
          ) : (
            <ExpensesList
              expenses={activeExpenses}
              members={members}
              currentUserName={currentUserName}
              paymentStates={paymentStates}
              onClaimPayment={handleClaimPayment}
              onConfirmPayment={handleConfirmPayment}
              onDeleteExpense={deleteExpense}
            />
          )}

          <AddExpenseForm
            isOpen={isAddingExpense}
            onClose={() => setIsAddingExpense(false)}
            onSubmit={addExpense}
            householdId={selectedHouseholdId}
            members={members}
          />
        </CardContent>
      </Card>

      <SettledExpensesSection
        settledExpenses={settledExpenses}
        members={members}
        currentUserName={currentUserName}
        paymentStates={paymentStates}
        settledExpensesOpen={settledExpensesOpen}
        onToggleSettledExpenses={setSettledExpensesOpen}
        onClaimPayment={handleClaimPayment}
        onConfirmPayment={handleConfirmPayment}
        onDeleteExpense={deleteExpense}
      />
    </div>
  );
};
