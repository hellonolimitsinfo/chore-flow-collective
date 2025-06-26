
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useExpenseFormValidation } from "./ExpenseFormValidation";

interface ExpenseFormValues {
  description: string;
  amount: string;
  paidBy: string;
  splitType: 'equal' | 'individual';
  owedBy: string[];
  individualAmounts: Record<string, string>;
  bankDetails: string;
}

interface ExpenseFormSheetProps {
  members: any[];
  isAddButtonDisabled: boolean;
  getDisabledTitle: () => string;
  onAddExpense: (values: ExpenseFormValues) => Promise<void>;
}

export const ExpenseFormSheet = ({ 
  members, 
  isAddButtonDisabled, 
  getDisabledTitle, 
  onAddExpense 
}: ExpenseFormSheetProps) => {
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

  const {
    watchSplitType,
    watchOwedBy,
    watchAmount,
    watchIndividualAmounts,
    getTotalIndividualAmount,
    isFormValid
  } = useExpenseFormValidation({ control: expenseForm.control });

  const handleSubmit = async (values: ExpenseFormValues) => {
    await onAddExpense(values);
    expenseForm.reset();
  };

  return (
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
            <form onSubmit={expenseForm.handleSubmit(handleSubmit)} className="space-y-6">
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

                  {watchOwedBy?.length > 0 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-gray-200">Individual Amounts</Label>
                        {watchOwedBy.map((person: string) => (
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
                              const equalAmount = (parseFloat(watchAmount || "0") / watchOwedBy.length).toFixed(2);
                              const amounts: Record<string, string> = {};
                              watchOwedBy.forEach((person: string) => {
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

              {!isFormValid() && (
                <div className="text-orange-400 text-sm text-center">
                  Please fill in all fields before adding the expense
                </div>
              )}

              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" variant="outline" className="border-gray-600 text-gray-300">
                    Cancel
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button 
                    type="submit" 
                    className="bg-blue-700 hover:bg-blue-800"
                    disabled={!isFormValid()}
                  >
                    Add Expense
                  </Button>
                </SheetClose>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
