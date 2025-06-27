
import { ChevronDown, ChevronRight, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExpenseCard } from "./ExpenseCard";

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

interface Member {
  user_id: string;
  full_name: string | null;
  email: string;
}

type PaymentState = 'pending' | 'claimed' | 'confirmed';

interface SettledExpensesSectionProps {
  settledExpenses: Expense[];
  members: Member[];
  currentUserName: string;
  paymentStates: Record<string, Record<string, PaymentState>>;
  settledExpensesOpen: boolean;
  onToggleSettledExpenses: (open: boolean) => void;
  onClaimPayment: (expense: Expense, memberName: string) => void;
  onConfirmPayment: (expense: Expense, memberName: string) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const SettledExpensesSection = ({
  settledExpenses,
  members,
  currentUserName,
  paymentStates,
  settledExpensesOpen,
  onToggleSettledExpenses,
  onClaimPayment,
  onConfirmPayment,
  onDeleteExpense
}: SettledExpensesSectionProps) => {
  if (settledExpenses.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <Collapsible open={settledExpensesOpen} onOpenChange={onToggleSettledExpenses}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-gray-700/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-gray-100">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Settled Expenses
              </div>
              {settledExpensesOpen ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3">
            {settledExpenses.map(expense => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                members={members}
                currentUserName={currentUserName}
                paymentStates={paymentStates}
                onClaimPayment={onClaimPayment}
                onConfirmPayment={onConfirmPayment}
                onDeleteExpense={onDeleteExpense}
                isSettled={true}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
