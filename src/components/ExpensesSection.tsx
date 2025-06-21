
import { DollarSign, Plus, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export const ExpensesSection = () => {
  const { theme } = useTheme();
  
  const expenses = [
    {
      id: 1,
      title: "Groceries",
      amount: "$45.50",
      paidBy: "Alex",
      split: "All members",
      details: "Sam owes £15.17\nJordan owes £15.17",
      bankDetails: "Alex Bank - 123456790"
    },
    {
      id: 2,
      title: "Internet Bill",
      amount: "$60.00",
      paidBy: "Sam",
      split: "All members",
      details: "Alex owes £20.00\nJordan owes £20.00",
      bankDetails: "Sam Bank - 098765432"
    }
  ];

  return (
    <Card className={theme === 'light' ? 'bg-white border-[#ddd] shadow-sm' : 'bg-slate-800 border-slate-700'}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className={`flex items-center ${theme === 'light' ? 'text-[#111111]' : 'text-white'}`}>
          <DollarSign className="w-5 h-5 mr-2" />
          Expenses
        </CardTitle>
        <Button 
          size="sm" 
          className={theme === 'light' ? 'bg-[#007BFF] hover:bg-[#0056b3] text-white shadow-sm' : 'bg-blue-600 hover:bg-blue-700'}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Expense
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {expenses.map((expense) => (
          <div 
            key={expense.id} 
            className={`p-3 rounded-lg ${theme === 'light' ? 'bg-[#fafafa] border border-[#ddd]' : 'bg-slate-700/50'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-medium ${theme === 'light' ? 'text-[#111111]' : 'text-white'}`}>{expense.title}</h4>
              <div className="flex items-center space-x-2">
                <span className={`font-semibold ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>{expense.amount}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={theme === 'light' ? 'text-[#666666] hover:text-[#111111]' : 'text-slate-400'}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p className={theme === 'light' ? 'text-[#333333]' : 'text-slate-300'}>
                <span className={theme === 'light' ? 'text-[#666666]' : 'text-slate-400'}>Paid by:</span> {expense.paidBy}
              </p>
              <p className={theme === 'light' ? 'text-[#333333]' : 'text-slate-300'}>
                <span className={theme === 'light' ? 'text-[#666666]' : 'text-slate-400'}>Split:</span> {expense.split}
              </p>
              <div className={`whitespace-pre-line ${theme === 'light' ? 'text-orange-600' : 'text-orange-400'}`}>
                {expense.details}
              </div>
              <p className={`text-xs ${theme === 'light' ? 'text-[#888888]' : 'text-slate-500'}`}>
                <span className={theme === 'light' ? 'text-[#666666]' : 'text-slate-400'}>Bank:</span> {expense.bankDetails}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
