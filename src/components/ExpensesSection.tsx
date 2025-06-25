import { useState } from "react";
import { DollarSign, Plus, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import { useExpenses } from "@/hooks/useExpenses";
import { supabase } from "@/integrations/supabase/client";

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

export const ExpensesSection = ({ selectedHouseholdId }: ExpensesSectionProps) => {
  const { toast } = useToast();
  const { members, loading: membersLoading } = useHouseholdMembers(selectedHouseholdId);
  const { expenses, loading: expensesLoading, addExpense, deleteExpense } = useExpenses(selectedHouseholdId);
  const [pendingPayments, setPendingPayments] = useState<Record<string, string[]>>({});

  const expenseForm = useForm<ExpenseFormValues>({
    defaultValues: {
      description: "",
      amount: "",
      paidBy: "",
      splitType: "equal",
      owedBy: [],
      individualAmounts: {},
      bankDetails: ""
    }
  });

  const watchSplitType = expenseForm.watch("splitType");
  const watchOwedBy = expenseForm.watch("owedBy");
  const watchAmount = expenseForm.watch("amount");
  const watchIndividualAmounts = expenseForm.watch("individualAmounts");

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
      // For individual split, store the amounts with member names
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

    const result = await addExpense(expenseData);
    if (result) {
      expenseForm.reset();
    }
  };

  const logPaymentAction = async (expenseId: string, memberName: string, action: 'claimed' | 'confirmed', expenseDescription: string) => {
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

  const handleMarkAsPaid = async (expenseId: string, memberName: string, expenseDescription: string) => {
    setPendingPayments(prev => ({
      ...prev,
      [expenseId]: [...(prev[expenseId] || []), memberName]
    }));
    
    await logPaymentAction(expenseId, memberName, 'claimed', expenseDescription);
    
    toast({
      title: "Payment claimed! 💳",
      description: `${memberName} says they have paid. Waiting for confirmation.`,
    });
  };

  const handleConfirmPayment = async (expenseId: string, memberName: string, expenseDescription: string) => {
    setPendingPayments(prev => ({
      ...prev,
      [expenseId]: (prev[expenseId] || []).filter(name => name !== memberName)
    }));
    
    await logPaymentAction(expenseId, memberName, 'confirmed', expenseDescription);
    
    toast({
      title: "Payment confirmed! ✅",
      description: `Payment from ${memberName} has been confirmed.`,
    });
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
      // For individual split, parse the stored amounts
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

  const getTotalIndividualAmount = () => {
    return Object.values(watchIndividualAmounts).reduce((sum, amount) => {
      return sum + (parseFloat(amount as string) || 0);
    }, 0);
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
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              size="sm" 
              className="h-8 bg-blue-700 hover:bg-blue-800"
              disabled={isAddButtonDisabled}
              title={getDisabledTitle()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Expense
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-gray-800 border-gray-700 w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-gray-100">Add New Expense</SheetTitle>
              <SheetDescription className="text-gray-400">
                Add a new expense and specify how it should be split among flatmates.
              </SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <Form {...expenseForm}>
                <form onSubmit={expenseForm.handleSubmit(addNewExpense)} className="space-y-6">
                  <FormField
                    control={expenseForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Expense Description</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Groceries, Internet Bill" 
                            {...field}
                            required
                            className="bg-gray-700 border-gray-600 text-gray-100"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={expenseForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Amount (£)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="e.g. 45.50" 
                            {...field}
                            required
                            className="bg-gray-700 border-gray-600 text-gray-100"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={expenseForm.control}
                    name="paidBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Paid By</FormLabel>
                        <FormControl>
                          <select 
                            className="w-full p-2 border rounded-md bg-gray-700 border-gray-600 text-gray-100"
                            {...field}
                            required
                          >
                            <option value="">Select who paid</option>
                            {members.map(member => (
                              <option key={member.user_id} value={member.full_name || member.email}>
                                {member.full_name || member.email}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={expenseForm.control}
                    name="splitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Split Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="equal" id="equal" />
                              <Label htmlFor="equal" className="text-gray-300">Split equally with all members</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="individual" id="individual" />
                              <Label htmlFor="individual" className="text-gray-300">Split individually</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {watchSplitType === 'individual' && (
                    <>
                      <FormField
                        control={expenseForm.control}
                        name="owedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-200">People Owing Money</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {members.map(member => (
                                  <div key={member.user_id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={member.user_id}
                                      checked={field.value.includes(member.full_name || member.email)}
                                      onCheckedChange={(checked) => {
                                        const memberName = member.full_name || member.email;
                                        if (checked) {
                                          field.onChange([...field.value, memberName]);
                                        } else {
                                          field.onChange(field.value.filter(name => name !== memberName));
                                          // Clear the individual amount when unchecked
                                          const currentAmounts = expenseForm.getValues("individualAmounts");
                                          delete currentAmounts[memberName];
                                          expenseForm.setValue("individualAmounts", currentAmounts);
                                        }
                                      }}
                                    />
                                    <Label htmlFor={member.user_id} className="text-gray-300">
                                      {member.full_name || member.email}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {watchOwedBy.length > 0 && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-gray-200">Individual Amounts</Label>
                            {watchOwedBy.map(person => (
                              <FormField
                                key={person}
                                control={expenseForm.control}
                                name={`individualAmounts.${person}`}
                                render={({ field }) => (
                                  <div className="flex items-center space-x-2">
                                    <Label className="text-gray-300 w-24 text-sm">{person}:</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      {...field}
                                      className="bg-gray-700 border-gray-600 text-gray-100 flex-1"
                                    />
                                    <span className="text-gray-400 text-sm">£</span>
                                  </div>
                                )}
                              />
                            ))}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const equalAmount = (parseFloat(watchAmount) / watchOwedBy.length).toFixed(2);
                                  const amounts: Record<string, string> = {};
                                  watchOwedBy.forEach(person => {
                                    amounts[person] = equalAmount;
                                  });
                                  expenseForm.setValue("individualAmounts", amounts);
                                }}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              >
                                Split Equally
                              </Button>
                            </div>
                            
                            <div className="bg-gray-700 p-3 rounded-md">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-300">Total assigned:</span>
                                <span className="text-gray-300">£{getTotalIndividualAmount().toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-300">Expense total:</span>
                                <span className="text-gray-300">£{parseFloat(watchAmount || "0").toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm font-medium">
                                <span className="text-gray-300">Remaining:</span>
                                <span className={`${
                                  (parseFloat(watchAmount || "0") - getTotalIndividualAmount()) === 0 
                                    ? "text-green-400" 
                                    : "text-orange-400"
                                }`}>
                                  £{(parseFloat(watchAmount || "0") - getTotalIndividualAmount()).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <FormField
                    control={expenseForm.control}
                    name="bankDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Bank Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g. Bank Name - Account Number" 
                            {...field}
                            required
                            className="bg-gray-700 border-gray-600 text-gray-100 min-h-[80px]"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <SheetFooter>
                    <SheetClose asChild>
                      <Button type="button" variant="outline" className="border-gray-600 text-gray-300">
                        Cancel
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button type="submit" className="bg-blue-700 hover:bg-blue-800">
                        Add Expense
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent>
        {shouldShowExamplesButton && (
          <div className="mb-4">
            <Button 
              onClick={addExampleExpenses}
              variant="outline" 
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Examples
            </Button>
          </div>
        )}
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
              <div key={expense.id} className="p-4 border rounded-lg border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-200">{expense.description}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-400">£{expense.amount.toFixed(2)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <DropdownMenuItem 
                          onClick={() => deleteExpense(expense.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                    {calculateDebts(expense).map(debt => (
                      <div key={debt.name} className="flex items-center justify-between text-sm">
                        <span className="text-orange-400">
                          {debt.name} owes £{debt.amount.toFixed(2)}
                        </span>
                        {pendingPayments[expense.id]?.includes(debt.name) ? (
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400 text-xs">
                              Says paid
                            </span>
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
                                    onClick={() => handleConfirmPayment(expense.id, debt.name, expense.description)}
                                    className="bg-green-700 hover:bg-green-800"
                                  >
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ) : (
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
                                  onClick={() => handleMarkAsPaid(expense.id, debt.name, expense.description)}
                                  className="bg-blue-700 hover:bg-blue-800"
                                >
                                  Mark as Paid
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    <span className="text-gray-400">Bank:</span> {expense.bank_details}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
