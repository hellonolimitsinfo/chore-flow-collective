
import { useWatch } from "react-hook-form";

interface ExpenseFormValues {
  description: string;
  amount: string;
  paidBy: string;
  splitType: 'equal' | 'individual';
  owedBy: string[];
  individualAmounts: Record<string, string>;
  bankDetails: string;
}

interface UseExpenseFormValidationProps {
  control: any;
}

export const useExpenseFormValidation = ({ control }: UseExpenseFormValidationProps) => {
  const watchSplitType = useWatch({ control, name: "splitType" });
  const watchOwedBy = useWatch({ control, name: "owedBy" });
  const watchAmount = useWatch({ control, name: "amount" });
  const watchIndividualAmounts = useWatch({ control, name: "individualAmounts" });
  const watchDescription = useWatch({ control, name: "description" });
  const watchPaidBy = useWatch({ control, name: "paidBy" });
  const watchBankDetails = useWatch({ control, name: "bankDetails" });

  const getTotalIndividualAmount = () => {
    return Object.values(watchIndividualAmounts || {}).reduce((sum, amount) => {
      return sum + (parseFloat(amount as string) || 0);
    }, 0);
  };

  const isFormValid = () => {
    const basicFieldsFilled = watchDescription && watchAmount && watchPaidBy && watchBankDetails;
    
    if (watchSplitType === 'individual') {
      const hasSelectedMembers = watchOwedBy?.length > 0;
      const allAmountsFilled = watchOwedBy?.every((person: string) => 
        watchIndividualAmounts?.[person] && parseFloat(watchIndividualAmounts[person]) > 0
      );
      const totalMatches = Math.abs(getTotalIndividualAmount() - parseFloat(watchAmount || "0")) < 0.01;
      
      return basicFieldsFilled && hasSelectedMembers && allAmountsFilled && totalMatches;
    }
    
    return basicFieldsFilled;
  };

  return {
    watchSplitType,
    watchOwedBy,
    watchAmount,
    watchIndividualAmounts,
    watchDescription,
    watchPaidBy,
    watchBankDetails,
    getTotalIndividualAmount,
    isFormValid
  };
};
