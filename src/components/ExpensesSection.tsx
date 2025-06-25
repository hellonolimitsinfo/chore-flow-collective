
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
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitType: 'equal' | 'individual';
  owedBy: string[];
  bankDetails: string;
  date: Date;
  household_id: string;
}

interface ExpenseFormValues {
  description: string;
  amount: string;
  paidBy: string;
  splitType: 'equal' | 'individual';
  owedBy: string[];
  bankDetails: string;
}

interface ExpensesSectionProps {
  selectedHouseholdId: string | null;
}

export const ExpensesSection = ({ selectedHouseholdId }: ExpensesSectionProps) => {
  const { toast } = useToast();
  const { members, loading: membersLoading } = useHouseholdMembers(selectedHouseholdId);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const expenseForm = useForm<ExpenseFormValues>({
    defaultValues: {
      description: "",
      amount: "",
      paidBy: "",
      splitType: "equal",
      owedBy: [],
      bankDetails: ""
    }
  });

  const watchSplitType = expenseForm.watch("splitType");
  const watchOwedBy = expenseForm.watch("owedBy");

  const addExampleExpenses = () => {
    if (!selectedHouseholdId || members.length === 0) return;

    const exampleExpenses: Expense[] = [
      {
        id: "1",
        description: "Groceries",
        amount: 45.50,
        paidBy: members[0]?.full_name || members[0]?.email || "Member 1",
        splitType: "equal",
        owedBy: members.map(m => m.full_name || m.email),
        bankDetails: `${members[0]?.full_name || "Member 1"} Bank - 1234567890`,
        date: new Date(),
        household_id: selectedHouseholdId
      },
      {
        id: "2",
        description: "Internet Bill",
        amount: 60.00,
        paidBy: members[1]?.full_name || members[1]?.email || "Member 2",
        splitType: "equal",
        owedBy: members.map(m => m.full_name || m.email),
        bankDetails: `${members[1]?.full_name || "Member 2"} Bank - 0987654321`,
        date: new Date(),
        household_id: selectedHouseholdId
      }
    ];

    setExpenses(exampleExpenses);
    toast({
      title: "Example expenses added! 💰",
      description: "Sample expenses have been added to get you started.",
    });
  };

  const addNewExpense = (values: ExpenseFormValues) => {
    if (!selectedHouseholdId) return;

    const owedByList = values.splitType === 'equal' 
      ? members.map(m => m.full_name || m.email)
      : values.owedBy;

    const newExpense: Expense = {
      id: `${Date.now()}`,
      description: values.description,
      amount: parseFloat(values.amount),
      paidBy: values.paidBy,
      splitType: values.splitType,
      owedBy: owedByList,
      bankDetails: values.bankDetails,
      date: new Date(),
      household_id: selectedHouseholdId
    };

    setExpenses(prev => [...prev, newExpense]);

    toast({
      title: "Expense added! 💰",
      description: `${values.description} has been added to expenses.`,
    });

    expenseForm.reset();
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    toast({
      title: "Expense deleted",
      description: "The expense has been removed from the list.",
    });
  };

  const calculateDebts = (expense: Expense) => {
    const payer = expense.paidBy;
    const owedMembers = expense.owedBy.filter(member => member !== payer);
    
    if (expense.splitType === 'equal') {
      const amountPerPerson = expense.amount / expense.owedBy.length;
      return owedMembers.map(member => ({
        name: member,
        amount: amountPerPerson
      }));
    } else {
      // For individual split, divide equally among those who owe
      const amountPerPerson = expense.amount / owedMembers.length;
      return owedMembers.map(member => ({
        name: member,
        amount: amountPerPerson
      }));
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
                              <Label htmlFor="equal" className="text-gray-300">Split with all members</Label>
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
                    <FormField
                      control={expenseForm.control}
                      name="owedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-200">Person Owing Money</FormLabel>
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
                  )}

                  {watchSplitType === 'individual' && watchOwedBy.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-gray-200">Split Preview:</Label>
                      <div className="bg-gray-700 p-3 rounded-md space-y-1">
                        {watchOwedBy.map(person => (
                          <div key={person} className="text-sm text-gray-300">
                            {person} owes £{expenseForm.watch("amount") ? (parseFloat(expenseForm.watch("amount")) / watchOwedBy.length).toFixed(2) : "0.00"}
                          </div>
                        ))}
                      </div>
                    </div>
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
                    <span className="text-gray-300">{expense.paidBy}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Split:</span>
                    <Badge variant="outline" className="text-gray-300">
                      {expense.splitType === 'equal' ? 'All members' : 'Individual'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {calculateDebts(expense).map(debt => (
                      <div key={debt.name} className="text-sm text-orange-400">
                        {debt.name} owes £{debt.amount.toFixed(2)}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    <span className="text-gray-400">Bank:</span> {expense.bankDetails}
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
