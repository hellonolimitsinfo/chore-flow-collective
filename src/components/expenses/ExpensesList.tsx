
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

interface ExpensesListProps {
  expenses: Expense[];
  members: Member[];
  currentUserName: string;
  paymentStates: Record<string, Record<string, PaymentState>>;
  onClaimPayment: (expense: Expense, memberName: string) => void;
  onConfirmPayment: (expense: Expense, memberName: string) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const ExpensesList = ({
  expenses,
  members,
  currentUserName,
  paymentStates,
  onClaimPayment,
  onConfirmPayment,
  onDeleteExpense
}: ExpensesListProps) => {
  return (
    <div className="space-y-3">
      {expenses.map(expense => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          members={members}
          currentUserName={currentUserName}
          paymentStates={paymentStates}
          onClaimPayment={onClaimPayment}
          onConfirmPayment={onConfirmPayment}
          onDeleteExpense={onDeleteExpense}
        />
      ))}
    </div>
  );
};
