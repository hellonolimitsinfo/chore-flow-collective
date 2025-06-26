
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentActions } from "./PaymentActions";

interface ExpenseCardProps {
  expense: any;
  paymentStatuses: Record<string, any>;
  calculateDebts: (expense: any) => { name: string; amount: number }[];
  onDeleteExpense: (expenseId: string) => void;
  onMarkAsPaid: (expenseId: string, memberName: string, expenseDescription: string) => void;
  onConfirmPayment: (expenseId: string, memberName: string, expenseDescription: string) => void;
}

export const ExpenseCard = ({ 
  expense, 
  paymentStatuses, 
  calculateDebts, 
  onDeleteExpense, 
  onMarkAsPaid, 
  onConfirmPayment 
}: ExpenseCardProps) => {
  const expensePaymentStatus = paymentStatuses[expense.id] || {};

  return (
    <div className="p-4 border rounded-lg border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-200">{expense.description}</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-green-400">£{expense.amount.toFixed(2)}</span>
          <Button 
            onClick={() => onDeleteExpense(expense.id)}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs border-red-600 text-red-400 hover:bg-red-700"
          >
            Delete
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Paid by:</span>
          <span className="text-gray-300">{expense.paid_by}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Split:</span>
          <Badge variant="outline" className="text-gray-300">
            {expense.split_type === 'equal' ? 'All members' : 'Individual'}
          </Badge>
        </div>
        <div className="space-y-2">
          {calculateDebts(expense).map(debt => {
            const debtStatus = expensePaymentStatus[debt.name];
            
            return (
              <div key={debt.name} className="flex items-center justify-between text-sm">
                <span className={`${
                  debtStatus?.status === 'settled' 
                    ? 'text-green-400 line-through' 
                    : 'text-orange-400'
                }`}>
                  {debt.name} owes £{debt.amount.toFixed(2)}
                  {debtStatus?.status === 'pending' && <span className="text-yellow-400 ml-2">(Says paid)</span>}
                </span>
                <PaymentActions
                  debt={debt}
                  expense={expense}
                  paymentStatus={debtStatus || { status: 'unpaid', showPaidButton: false, showConfirmButton: false }}
                  onMarkAsPaid={onMarkAsPaid}
                  onConfirmPayment={onConfirmPayment}
                />
              </div>
            );
          })}
        </div>
        <div className="text-xs text-gray-500 mt-2 space-y-1">
          <div>
            <span className="text-gray-400">Bank Details:</span> {expense.bank_details}
          </div>
          <div>
            <span className="text-gray-400">Date Created:</span> {new Date(expense.created_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
