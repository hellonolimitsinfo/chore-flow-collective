
import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Trash2, CreditCard, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useExpenses } from "@/hooks/useExpenses";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AddExpenseForm } from "./expenses/AddExpenseForm";

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
          // Refresh expenses and payment states when payment logs change
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

      // Refresh payment states immediately
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

      // Check if all debts are now settled
      const currentStates = { ...paymentStates };
      if (!currentStates[expense.id]) currentStates[expense.id] = {};
      currentStates[expense.id][memberName] = 'confirmed';

      const allConfirmed = expense.owed_by.every(person => 
        currentStates[expense.id][person] === 'confirmed'
      );

      if (allConfirmed) {
        // Store expense in history before deleting
        await storeExpenseInHistory(expense);
        
        // All debts are settled, remove from expenses list
        await deleteExpense(expense.id);
        toast({
          title: "Expense fully settled! 🎉",
          description: `All payments for ${expense.description} have been confirmed`,
        });
      }

      // Refresh payment states immediately
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

  const storeExpenseInHistory = async (expense: Expense) => {
    try {
      const { error } = await supabase
        .from('expense_history')
        .insert([{
          household_id: expense.household_id,
          original_expense_id: expense.id,
          description: expense.description,
          amount: expense.amount,
          paid_by: expense.paid_by,
          split_type: expense.split_type,
          owed_by: expense.owed_by,
          bank_details: expense.bank_details,
          created_at: expense.created_at,
          settled_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing expense in history:', error);
    }
  };

  const getPaymentState = (expenseId: string, memberName: string): PaymentState => {
    return paymentStates[expenseId]?.[memberName] || 'pending';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderPaymentStatus = (expense: Expense, memberName: string) => {
    const state = getPaymentState(expense.id, memberName);
    const currentUserName = members.find(m => m.user_id === user?.id)?.full_name || 
                           members.find(m => m.user_id === user?.id)?.email || 
                           'Unknown';
    const isPayer = expense.paid_by === currentUserName;

    // Don't show payment button for the person who originally paid
    if (memberName === expense.paid_by) {
      return <Badge variant="outline" className="ml-2 text-green-600">✅ Paid</Badge>;
    }

    switch (state) {
      case 'pending':
        if (memberName === currentUserName) {
          return (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleClaimPayment(expense, memberName)}
              className="ml-2"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Paid
            </Button>
          );
        }
        return <Badge variant="secondary" className="ml-2">Pending</Badge>;
      
      case 'claimed':
        if (isPayer) {
          return (
            <div className="flex gap-1 ml-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConfirmPayment(expense, memberName)}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Confirm
              </Button>
            </div>
          );
        }
        return <Badge variant="outline" className="ml-2 text-yellow-600">Awaiting Confirmation</Badge>;
      
      case 'confirmed':
        return (
          <Badge variant="outline" className="ml-2 text-green-600 line-through">
            ✅ Settled
          </Badge>
        );
      
      default:
        return null;
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
        {expenses.length === 0 && (
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
        ) : expenses.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No expenses yet. Add your first expense!
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(expense => (
              <div key={expense.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-200">{expense.description}</h4>
                      <Badge variant="secondary">£{expense.amount}</Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      Paid by: {expense.paid_by}
                    </p>
                    <div className="text-sm text-gray-400 mb-2">
                      Bank: {expense.bank_details}
                    </div>
                    <div className="text-sm text-gray-400 mb-3">
                      Date Created: {formatDate(expense.created_at)}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                      <DropdownMenuItem 
                        onClick={() => deleteExpense(expense.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-300 mb-2">
                    {expense.split_type === 'equal' ? 'Split equally among:' : 'Owed by:'}
                  </div>
                  {expense.owed_by.map(person => {
                    const state = getPaymentState(expense.id, person);
                    return (
                      <div 
                        key={person} 
                        className={`flex items-center justify-between p-2 rounded border ${
                          state === 'confirmed' 
                            ? 'bg-green-900/20 border-green-800 text-green-200' 
                            : 'bg-gray-700/50 border-gray-600'
                        }`}
                      >
                        <span className={state === 'confirmed' ? 'line-through' : ''}>
                          {person}
                        </span>
                        {renderPaymentStatus(expense, person)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
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
  );
};
