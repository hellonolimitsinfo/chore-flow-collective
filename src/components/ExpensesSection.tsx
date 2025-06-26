import { useState, useEffect } from "react";
import { DollarSign, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseFormSheet } from "./expenses/ExpenseFormSheet";
import { ExpenseCard } from "./expenses/ExpenseCard";

interface ExpenseFormValues {
  description: string;
  amount: string;
  paidBy: string;
  splitType: 'equal' | 'individual';
  owedBy: string[];
  individualAmounts: Record<string, string>;
  bankDetails: string;
}

interface ExpensesSectionProps {
  selectedHouseholdId: string | null;
}

interface PaymentStatus {
  [key: string]: {
    status: 'settled' | 'pending' | 'unpaid';
    showPaidButton: boolean;
    showConfirmButton: boolean;
  };
}

export const ExpensesSection = ({ selectedHouseholdId }: ExpensesSectionProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { members, loading: membersLoading } = useHouseholdMembers(selectedHouseholdId);
  const { expenses, loading: expensesLoading, addExpense, deleteExpense } = useExpenses(selectedHouseholdId);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, PaymentStatus>>({});

  // Load payment statuses for all expenses
  useEffect(() => {
    const loadPaymentStatuses = async () => {
      if (!expenses.length) return;

      const statusPromises = expenses.map(async (expense) => {
        const debts = calculateDebts(expense);
        const debtStatuses: PaymentStatus = {};

        for (const debt of debts) {
          const status = await getDebtStatus(expense, debt.name);
          const showPaidButton = await shouldShowPaidButton(expense, debt.name);
          const showConfirmButton = await shouldShowConfirmButton(expense, debt.name);

          debtStatuses[debt.name] = {
            status,
            showPaidButton,
            showConfirmButton
          };
        }

        return { expenseId: expense.id, statuses: debtStatuses };
      });

      const results = await Promise.all(statusPromises);
      const newStatuses: Record<string, PaymentStatus> = {};

      results.forEach(({ expenseId, statuses }) => {
        newStatuses[expenseId] = statuses;
      });

      setPaymentStatuses(newStatuses);
    };

    loadPaymentStatuses();
  }, [expenses, user]);

  const logPaymentAction = async (expenseId: string, memberName: string, action: 'claimed' | 'confirmed' | 'completed', expenseDescription: string) => {
    try {
      await supabase.from('payment_logs').insert({
        household_id: selectedHouseholdId,
        expense_id: expenseId,
        member_name: memberName,
        action: action,
        expense_description: expenseDescription,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging payment action:', error);
    }
  };

  const getPaymentStatus = async (expenseId: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_logs')
        .select('member_name, action')
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pendingPayments: string[] = [];
      const settledDebts: string[] = [];

      data?.forEach(log => {
        if (log.action === 'claimed' && !settledDebts.includes(log.member_name)) {
          if (!pendingPayments.includes(log.member_name)) {
            pendingPayments.push(log.member_name);
          }
        } else if (log.action === 'confirmed') {
          const pendingIndex = pendingPayments.indexOf(log.member_name);
          if (pendingIndex > -1) {
            pendingPayments.splice(pendingIndex, 1);
          }
          if (!settledDebts.includes(log.member_name)) {
            settledDebts.push(log.member_name);
          }
        }
      });

      return { pendingPayments, settledDebts };
    } catch (error) {
      console.error('Error getting payment status:', error);
      return { pendingPayments: [], settledDebts: [] };
    }
  };

  const getCurrentUserName = () => {
    const currentMember = members.find(m => m.user_id === user?.id);
    return currentMember?.full_name || currentMember?.email || '';
  };

  const shouldShowPaidButton = async (expense: any, debtorName: string) => {
    const currentUserName = getCurrentUserName();
    const isDebtor = currentUserName === debtorName;
    
    if (!isDebtor) return false;
    
    const { pendingPayments, settledDebts } = await getPaymentStatus(expense.id);
    const isPending = pendingPayments.includes(debtorName);
    const isSettled = settledDebts.includes(debtorName);
    
    return !isPending && !isSettled;
  };

  const shouldShowConfirmButton = async (expense: any, debtorName: string) => {
    const currentUserName = getCurrentUserName();
    const isPayer = currentUserName === expense.paid_by;
    
    if (!isPayer) return false;
    
    const { pendingPayments, settledDebts } = await getPaymentStatus(expense.id);
    const isPending = pendingPayments.includes(debtorName);
    const isSettled = settledDebts.includes(debtorName);
    
    return isPending && !isSettled;
  };

  const getDebtStatus = async (expense: any, debtorName: string) => {
    const { pendingPayments, settledDebts } = await getPaymentStatus(expense.id);
    const isPending = pendingPayments.includes(debtorName);
    const isSettled = settledDebts.includes(debtorName);
    
    if (isSettled) return 'settled';
    if (isPending) return 'pending';
    return 'unpaid';
  };

  const addExampleExpenses = async () => {
    if (!selectedHouseholdId || members.length === 0) return;

    const exampleExpenses = [
      {
        household_id: selectedHouseholdId,
        description: "Groceries",
        amount: 45.50,
        paid_by: members[0]?.full_name || members[0]?.email || "Member 1",
        split_type: "equal" as const,
        owed_by: members.map(m => m.full_name || m.email),
        bank_details: `${members[0]?.full_name || "Member 1"} Bank - 1234567890`,
      },
      {
        household_id: selectedHouseholdId,
        description: "Internet Bill",
        amount: 60.00,
        paid_by: members[1]?.full_name || members[1]?.email || "Member 2",
        split_type: "equal" as const,
        owed_by: members.map(m => m.full_name || m.email),
        bank_details: `${members[1]?.full_name || "Member 2"} Bank - 0987654321`,
      }
    ];

    for (const expense of exampleExpenses) {
      await addExpense(expense);
    }

    toast({
      title: "Example expenses added! 💰",
      description: "Sample expenses have been added to get you started.",
    });
  };

  const addNewExpense = async (values: ExpenseFormValues) => {
    if (!selectedHouseholdId) return;

    let owedByList: string[] = [];
    
    if (values.splitType === 'equal') {
      owedByList = members.map(m => m.full_name || m.email);
    } else {
      owedByList = values.owedBy.map(member => {
        const amount = values.individualAmounts[member] || "0";
        return `${member}:${amount}`;
      });
    }

    const expenseData = {
      household_id: selectedHouseholdId,
      description: values.description,
      amount: parseFloat(values.amount),
      paid_by: values.paidBy,
      split_type: values.splitType,
      owed_by: owedByList,
      bank_details: values.bankDetails,
    };

    await addExpense(expenseData);
  };

  const handleMarkAsPaid = async (expenseId: string, memberName: string, expenseDescription: string) => {
    await logPaymentAction(expenseId, memberName, 'claimed', expenseDescription);
    
    toast({
      title: "Payment claimed! 💳",
      description: `${memberName} says they have paid. Waiting for confirmation.`,
    });
    
    // Refresh payment statuses
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      const debts = calculateDebts(expense);
      const debtStatuses: PaymentStatus = {};

      for (const debt of debts) {
        const status = await getDebtStatus(expense, debt.name);
        const showPaidButton = await shouldShowPaidButton(expense, debt.name);
        const showConfirmButton = await shouldShowConfirmButton(expense, debt.name);

        debtStatuses[debt.name] = {
          status,
          showPaidButton,
          showConfirmButton
        };
      }

      setPaymentStatuses(prev => ({
        ...prev,
        [expenseId]: debtStatuses
      }));
    }
  };

  const handleConfirmPayment = async (expenseId: string, memberName: string, expenseDescription: string) => {
    await logPaymentAction(expenseId, memberName, 'confirmed', expenseDescription);
    
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      const allDebts = calculateDebts(expense);
      const { settledDebts } = await getPaymentStatus(expenseId);
      const updatedSettled = [...settledDebts, memberName];
      
      if (allDebts.length === updatedSettled.length) {
        await logPaymentAction(expenseId, 'System', 'completed', `All debts settled for ${expenseDescription}`);
        await deleteExpense(expenseId);
        
        toast({
          title: "Expense completed! ✅",
          description: `All debts for "${expenseDescription}" have been settled.`,
        });
        return;
      }
    }
    
    toast({
      title: "Payment confirmed! ✅",
      description: `Payment from ${memberName} has been confirmed.`,
    });
    
    if (expense) {
      const debts = calculateDebts(expense);
      const debtStatuses: PaymentStatus = {};

      for (const debt of debts) {
        const status = await getDebtStatus(expense, debt.name);
        const showPaidButton = await shouldShowPaidButton(expense, debt.name);
        const showConfirmButton = await shouldShowConfirmButton(expense, debt.name);

        debtStatuses[debt.name] = {
          status,
          showPaidButton,
          showConfirmButton
        };
      }

      setPaymentStatuses(prev => ({
        ...prev,
        [expenseId]: debtStatuses
      }));
    }
  };

  const calculateDebts = (expense: any) => {
    const payer = expense.paid_by;
    
    if (expense.split_type === 'equal') {
      const owedMembers = expense.owed_by.filter((member: string) => member !== payer);
      const amountPerPerson = expense.amount / expense.owed_by.length;
      return owedMembers.map((member: string) => ({
        name: member,
        amount: amountPerPerson
      }));
    } else {
      return expense.owed_by
        .filter((entry: string) => !entry.startsWith(payer + ":"))
        .map((entry: string) => {
          const [name, amount] = entry.split(":");
          return {
            name,
            amount: parseFloat(amount || "0")
          };
        });
    }
  };

  const isAddButtonDisabled = !selectedHouseholdId || membersLoading || members.length === 0;
  const shouldShowExamplesButton = expenses.length === 0 && selectedHouseholdId && members.length > 0;

  const getDisabledTitle = () => {
    if (!selectedHouseholdId) return "Select a household first";
    if (members.length === 0) return "No household members found";
    return "Add a new expense";
  };

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
          <DollarSign className="h-5 w-5" />
          Expenses
        </CardTitle>
        <div className="flex items-center gap-2">
          <ExpenseFormSheet
            members={members}
            isAddButtonDisabled={isAddButtonDisabled}
            getDisabledTitle={getDisabledTitle}
            onAddExpense={addNewExpense}
          />
          
          {shouldShowExamplesButton && (
            <Button 
              onClick={addExampleExpenses}
              variant="outline"
              size="sm"
              className="h-8 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Examples
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!selectedHouseholdId ? (
          <div className="text-gray-400 text-center py-4">
            Select a household to view expenses
          </div>
        ) : members.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No household members found
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No expenses yet. Add some to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                paymentStatuses={paymentStatuses}
                calculateDebts={calculateDebts}
                onDeleteExpense={deleteExpense}
                onMarkAsPaid={handleMarkAsPaid}
                onConfirmPayment={handleConfirmPayment}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
