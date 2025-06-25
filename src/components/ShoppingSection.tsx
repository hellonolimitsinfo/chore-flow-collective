
import * as React from "react";
import { ShoppingCart, Plus, CheckCircle, AlertTriangle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import { useShoppingItems } from "@/hooks/useShoppingItems";

interface ShoppingItemFormValues {
  name: string;
}

interface ShoppingSectionProps {
  selectedHouseholdId: string | null;
  onItemsChange?: (items: any[]) => void;
}

export const ShoppingSection = ({ selectedHouseholdId, onItemsChange }: ShoppingSectionProps) => {
  const { members, loading: membersLoading } = useHouseholdMembers(selectedHouseholdId);
  const { 
    shoppingItems, 
    loading: itemsLoading, 
    addShoppingItem, 
    deleteShoppingItem, 
    flagItemAsLow, 
    markItemAsBought,
    addExampleItems 
  } = useShoppingItems(selectedHouseholdId);
  
  const shoppingForm = useForm<ShoppingItemFormValues>({
    defaultValues: {
      name: ""
    }
  });

  // Notify parent component when items change
  React.useEffect(() => {
    onItemsChange?.(shoppingItems);
  }, [shoppingItems, onItemsChange]);

  const handleAddItem = async (values: ShoppingItemFormValues) => {
    if (members.length === 0) return;
    
    const success = await addShoppingItem(values.name, members[0].user_id);
    if (success) {
      shoppingForm.reset();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteShoppingItem(itemId);
  };

  const handleFlagItem = async (itemId: string) => {
    if (members.length === 0) return;
    const flaggerName = members[0]?.full_name || members[0]?.email || 'Someone';
    await flagItemAsLow(itemId, flaggerName);
  };

  const handleMarkAsBought = async (itemId: string) => {
    await markItemAsBought(itemId, members);
  };

  const handleAddExamples = async () => {
    await addExampleItems(members);
  };

  const getAssigneeColor = (assigneeName: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    const index = assigneeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const isAddButtonDisabled = !selectedHouseholdId || membersLoading || members.length === 0;
  const shouldShowExamplesButton = shoppingItems.length === 0 && selectedHouseholdId && members.length > 0;

  if (itemsLoading) {
    return (
      <Card className="bg-gray-800/80 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
            <ShoppingCart className="h-5 w-5" />
            Shopping Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400 text-center py-4">
            Loading shopping items...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
          <ShoppingCart className="h-5 w-5" />
          Shopping Items
        </CardTitle>
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              size="sm" 
              className="h-8 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-600 disabled:cursor-not-allowed"
              disabled={isAddButtonDisabled}
              title={
                !selectedHouseholdId 
                  ? "Select a household first" 
                  : members.length === 0 
                    ? "No household members found" 
                    : "Add a new shopping item"
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-gray-800 border-gray-700 w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="text-gray-100">Add Shopping Item</SheetTitle>
              <SheetDescription className="text-gray-400">
                Add a new item to the shopping list. Once added, the item will be assigned to the first household member.
              </SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <Form {...shoppingForm}>
                <form onSubmit={shoppingForm.handleSubmit(handleAddItem)} className="space-y-6">
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
      </CardHeader>
      <CardContent>
        {shouldShowExamplesButton && (
          <div className="mb-4">
            <Button 
              onClick={handleAddExamples}
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
            Select a household to view shopping items
          </div>
        ) : members.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No household members found
          </div>
        ) : shoppingItems.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No shopping items yet. Add some to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {shoppingItems.map(item => {
              const assignedMember = members.find(member => member.user_id === item.assigned_to);
              const assigneeName = assignedMember?.full_name || assignedMember?.email || 'Unknown';
              
              return (
                <div key={item.id} className={`p-4 border rounded-lg transition-all ${
                  item.is_low ? 'border-red-800 bg-red-900/30' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-700/50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-200">{item.name}</h3>
                    <div className="flex items-center gap-2">
                      {item.is_low && (
                        <Badge variant="destructive" className="text-xs">
                          Low Stock
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem 
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getAssigneeColor(assigneeName)}`}></div>
                      <span className="text-sm text-gray-300">
                        {assigneeName}'s responsibility
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      {!item.is_low && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleFlagItem(item.id)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Flag Low
                        </Button>
                      )}
                      {item.is_low && (
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkAsBought(item.id)}
                          className="bg-green-700 hover:bg-green-800"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Bought
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
