
import { useState } from "react";
import { MoreHorizontal, Trash2, CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

interface ExpenseCardProps {
  expense: Expense;
  members: Member[];
  currentUserName: string;
  paymentStates: Record<string, Record<string, PaymentState>>;
  onClaimPayment: (expense: Expense, memberName: string) => void;
  onConfirmPayment: (expense: Expense, memberName: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  isSettled?: boolean;
}

export const ExpenseCard = ({
  expense,
  members,
  currentUserName,
  paymentStates,
  onClaimPayment,
  onConfirmPayment,
  onDeleteExpense,
  isSettled = false
}: ExpenseCardProps) => {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ', ' + date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatAmount = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const calculateOwedAmount = (expense: Expense, memberName: string) => {
    if (expense.custom_amounts && expense.custom_amounts[memberName] !== undefined) {
      return expense.custom_amounts[memberName];
    }
    return expense.amount / expense.owed_by.length;
  };

  const getPaymentState = (expenseId: string, memberName: string): PaymentState => {
    return paymentStates[expenseId]?.[memberName] || 'pending';
  };

  const getSettledTime = (expenseId: string, memberName: string) => {
    const now = new Date();
    return now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const renderPaymentStatus = (expense: Expense, memberName: string) => {
    const state = getPaymentState(expense.id, memberName);
    const isPayer = expense.paid_by === currentUserName;

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
              onClick={() => onClaimPayment(expense, memberName)}
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
                onClick={() => onConfirmPayment(expense, memberName)}
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
          <Badge variant="outline" className="ml-2 text-green-600">
            ✅ Settled
          </Badge>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-gray-200">{expense.description}</h4>
            <div className="text-right">
              <div className="text-lg font-semibold text-green-400">
                {formatAmount(expense.amount)}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            Paid by: {expense.paid_by}
          </p>
          <div className="text-sm text-gray-400 mb-2">
            Bank: {expense.bank_details}
          </div>
          <div className="text-sm text-gray-400 mb-3">
            Date Created: {formatDateTime(expense.created_at)}
          </div>
        </div>
        
        {!isSettled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
              <DropdownMenuItem 
                onClick={() => onDeleteExpense(expense.id)}
                className="text-red-400 hover:text-red-300 hover:bg-gray-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-300 mb-2">
          {expense.split_type === 'equal' && !expense.custom_amounts ? 'Split equally among:' : 'Owed by:'}
        </div>
        {expense.owed_by.map(person => {
          const state = getPaymentState(expense.id, person);
          const owedAmount = calculateOwedAmount(expense, person);
          return (
            <div 
              key={person} 
              className={`flex items-center justify-between p-2 rounded border ${
                state === 'confirmed' 
                  ? 'bg-green-900/20 border-green-800 text-green-200' 
                  : 'bg-gray-700/50 border-gray-600'
              }`}
            >
              <div className="flex flex-col">
                <span className={state === 'confirmed' ? 'line-through' : ''}>
                  {person} owes {formatAmount(owedAmount)}
                </span>
                {state === 'confirmed' && (
                  <span className="text-xs text-green-400">
                    Settled at {getSettledTime(expense.id, person)}
                  </span>
                )}
              </div>
              {isSettled ? (
                person === expense.paid_by ? (
                  <Badge variant="outline" className="ml-2 text-green-600">✅ Paid</Badge>
                ) : (
                  <Badge variant="outline" className="ml-2 text-green-600">✅ Settled</Badge>
                )
              ) : (
                renderPaymentStatus(expense, person)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
