
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useState } from "react";

interface ShoppingItemFormValues {
  name: string;
}

interface AddShoppingItemSheetProps {
  isDisabled: boolean;
  disabledTitle: string;
  onAddItem: (name: string) => Promise<any>;
}

export const AddShoppingItemSheet = ({ isDisabled, disabledTitle, onAddItem }: AddShoppingItemSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const shoppingForm = useForm<ShoppingItemFormValues>({
    defaultValues: {
      name: ""
    }
  });

  const handleSubmit = async (values: ShoppingItemFormValues) => {
    await onAddItem(values.name);
    shoppingForm.reset();
    setIsOpen(false); // Auto-close the sheet
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          size="sm" 
          className="h-8 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-600 disabled:cursor-not-allowed"
          disabled={isDisabled}
          title={disabledTitle}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-gray-800 border-gray-700 w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-gray-100">Add Shopping Item</SheetTitle>
          <SheetDescription className="text-gray-400">
            Add a new item to the shopping list.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <Form {...shoppingForm}>
            <form onSubmit={shoppingForm.handleSubmit(handleSubmit)} className="space-y-6">
              <FormItem>
                <FormLabel className="text-gray-200">Item Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Paper Towels" 
                    {...shoppingForm.register("name")}
                    required
                    className="bg-gray-700 border-gray-600 text-gray-100"
                  />
                </FormControl>
              </FormItem>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" variant="outline" className="border-gray-600 text-gray-300">Cancel</Button>
                </SheetClose>
                <Button type="submit" className="bg-blue-700 hover:bg-blue-800">Add Item</Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
};
