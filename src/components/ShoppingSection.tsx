
import { ShoppingCart, Plus, CheckCircle, MoreHorizontal, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import { useShoppingItems } from "@/hooks/useShoppingItems";
import { useAuth } from "@/hooks/useAuth";

interface ShoppingItemFormValues {
  name: string;
}

interface ShoppingSectionProps {
  selectedHouseholdId: string | null;
}

export const ShoppingSection = ({ selectedHouseholdId }: ShoppingSectionProps) => {
  const { user } = useAuth();
  const { members, loading: membersLoading } = useHouseholdMembers(selectedHouseholdId);
  const { 
    shoppingItems, 
    loading, 
    addShoppingItem, 
    deleteShoppingItem, 
    markAsPurchased,
    updateShoppingItem 
  } = useShoppingItems(selectedHouseholdId);
  
  const shoppingForm = useForm<ShoppingItemFormValues>({
    defaultValues: {
      name: ""
    }
  });

  const addNewShoppingItem = async (values: ShoppingItemFormValues) => {
    await addShoppingItem(values.name);
    shoppingForm.reset();
  };

  const addExampleItems = async () => {
    if (!selectedHouseholdId) return;

    const exampleItems = [
      "Toilet Paper",
      "Dish Soap", 
      "Milk",
      "Cleaning Supplies"
    ];

    for (const item of exampleItems) {
      await addShoppingItem(item);
    }
  };

  const handleMarkPurchased = async (itemId: string) => {
    const currentUserName = user?.user_metadata?.full_name || user?.email || 'Someone';
    await markAsPurchased(itemId, currentUserName);
  };

  const handleFlagLow = async (itemId: string) => {
    const currentUserName = user?.user_metadata?.full_name || user?.email || 'Someone';
    await updateShoppingItem(itemId, { 
      purchased_by: currentUserName // We'll use this field to track who flagged it as low
    });
  };

  const isAddButtonDisabled = !selectedHouseholdId || membersLoading || members.length === 0;
  const shouldShowExamplesButton = shoppingItems.length === 0 && selectedHouseholdId && members.length > 0;

  // Sort items: unpurchased first, then purchased at the bottom
  const sortedItems = [...shoppingItems].sort((a, b) => {
    if (a.is_purchased && !b.is_purchased) return 1;
    if (!a.is_purchased && b.is_purchased) return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Get flagged items (items that have purchased_by set but are not purchased)
  const flaggedItems = shoppingItems.filter(item => !item.is_purchased && item.purchased_by);

  return (
    <>
      {flaggedItems.length > 0 && (
        <Card className="bg-amber-900/30 border-amber-700 mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-100 text-lg">
              <Flag className="h-5 w-5" />
              Urgent Items Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {flaggedItems.map(item => (
                <div key={item.id} className="p-3 border border-amber-800 rounded-lg bg-amber-900/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-amber-100">{item.name}</h4>
                      <p className="text-sm text-amber-300">(Flagged by {item.purchased_by})</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkPurchased(item.id)}
                        className="bg-green-700 hover:bg-green-800 text-xs"
                      >
                        Bought
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  Add a new item to the shopping list.
                </SheetDescription>
              </SheetHeader>
              <div className="py-6">
                <Form {...shoppingForm}>
                  <form onSubmit={shoppingForm.handleSubmit(addNewShoppingItem)} className="space-y-6">
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
                onClick={addExampleItems}
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
          ) : loading ? (
            <div className="text-gray-400 text-center py-4">
              Loading shopping items...
            </div>
          ) : shoppingItems.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              No shopping items yet. Add some to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {sortedItems.map(item => (
                <div key={item.id} className={`p-4 border rounded-lg transition-all ${
                  item.is_purchased ? 'border-green-800 bg-green-900/30' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-700/50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-200">{item.name}</h3>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem 
                            onClick={() => deleteShoppingItem(item.id)}
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
                      <span className="text-sm text-gray-300">
                        Quantity: {item.quantity}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      {!item.is_purchased ? (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleFlagLow(item.id)}
                            variant="outline"
                            className="border-amber-600 text-amber-300 hover:bg-amber-700/20"
                          >
                            <Flag className="h-4 w-4 mr-1" />
                            Flag Low
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleMarkPurchased(item.id)}
                            className="bg-green-700 hover:bg-green-800"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Bought
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm text-green-400">
                          ✅ Purchased{item.purchased_by ? ` by ${item.purchased_by}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
