
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PaymentActionsProps {
  debt: {
    name: string;
    amount: number;
  };
  expense: any;
  paymentStatus: {
    status: 'settled' | 'pending' | 'unpaid';
    showPaidButton: boolean;
    showConfirmButton: boolean;
  };
  onMarkAsPaid: (expenseId: string, memberName: string, expenseDescription: string) => void;
  onConfirmPayment: (expenseId: string, memberName: string, expenseDescription: string) => void;
}

export const PaymentActions = ({ 
  debt, 
  expense, 
  paymentStatus, 
  onMarkAsPaid, 
  onConfirmPayment 
}: PaymentActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      {paymentStatus.showPaidButton && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs border-blue-600 text-blue-400 hover:bg-blue-700"
            >
              Paid
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-800 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-100">Mark as Paid</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Are you sure you want to mark that {debt.name} has paid £{debt.amount.toFixed(2)} for {expense.description}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onMarkAsPaid(expense.id, debt.name, expense.description)}
                className="bg-blue-700 hover:bg-blue-800"
              >
                Mark as Paid
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {paymentStatus.showConfirmButton && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs border-green-600 text-green-400 hover:bg-green-700"
            >
              Confirm
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-800 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-100">Confirm Payment</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Are you sure you want to confirm that {debt.name} has paid £{debt.amount.toFixed(2)} for {expense.description}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onConfirmPayment(expense.id, debt.name, expense.description)}
                className="bg-green-700 hover:bg-green-800"
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {paymentStatus.status === 'pending' && !paymentStatus.showPaidButton && !paymentStatus.showConfirmButton && (
        <span className="text-yellow-400 text-xs">
          Awaiting confirmation
        </span>
      )}
    </div>
  );
};
