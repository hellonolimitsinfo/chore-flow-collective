
import { ShoppingCart, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import { useShoppingItems } from "@/hooks/useShoppingItems";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingItemCard } from "@/components/shopping/ShoppingItemCard";
import { AddShoppingItemSheet } from "@/components/shopping/AddShoppingItemSheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
      purchased_by: currentUserName // Use this field to track who flagged it as low
    });
    
    toast({
      title: "Item flagged as low stock",
      description: "This item has been added to urgent items needed.",
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

  const getDisabledTitle = () => {
    if (!selectedHouseholdId) return "Select a household first";
    if (members.length === 0) return "No household members found";
    return "Add a new shopping item";
  };

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
          <ShoppingCart className="h-5 w-5" />
          Shopping Items
        </CardTitle>
        <AddShoppingItemSheet
          isDisabled={isAddButtonDisabled}
          disabledTitle={getDisabledTitle()}
          onAddItem={addShoppingItem}
        />
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
              <ShoppingItemCard
                key={item.id}
                item={item}
                onMarkPurchased={handleMarkPurchased}
                onFlagLow={handleFlagLow}
                onDelete={deleteShoppingItem}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
