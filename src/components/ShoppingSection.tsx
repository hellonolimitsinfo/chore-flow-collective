import { ShoppingCart, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import { useShoppingItems } from "@/hooks/useShoppingItems";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingItemCard } from "@/components/shopping/ShoppingItemCard";
import { AddShoppingItemSheet } from "@/components/shopping/AddShoppingItemSheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShoppingSectionProps {
  selectedHouseholdId: string | null;
  onItemUpdated?: () => void;
  onShoppingAction?: () => void;
}

export const ShoppingSection = ({ selectedHouseholdId, onItemUpdated, onShoppingAction }: ShoppingSectionProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { members, loading: membersLoading } = useHouseholdMembers(selectedHouseholdId);
  const { 
    shoppingItems, 
    loading, 
    addShoppingItem, 
    deleteShoppingItem, 
    updateShoppingItem 
  } = useShoppingItems(selectedHouseholdId);
  const { toast } = useToast();

  // Log shopping actions to the shopping_logs table
  const logShoppingAction = async (action: string, itemName: string, memberName: string) => {
    if (!selectedHouseholdId) return;
    
    try {
      const { error } = await supabase
        .from('shopping_logs')
        .insert({
          household_id: selectedHouseholdId,
          action,
          item_name: itemName,
          member_name: memberName
        });

      if (error) throw error;
      
      // Notify parent about shopping action
      if (onShoppingAction) {
        onShoppingAction();
      }
    } catch (error) {
      console.error('Error logging shopping action:', error);
    }
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

  const getCurrentAssignedMember = (item: any) => {
    if (members.length === 0) return 'Unknown';
    
    if (typeof item.assigned_member_index === 'number' && item.assigned_member_index < members.length) {
      return members[item.assigned_member_index].full_name || members[item.assigned_member_index].email;
    }
    
    const sortedItems = [...shoppingItems].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const itemIndex = sortedItems.findIndex(sortedItem => sortedItem.id === item.id);
    const memberIndex = itemIndex % members.length;
    return members[memberIndex].full_name || members[memberIndex].email;
  };

  const handleMarkPurchased = async (itemId: string) => {
    const currentUserName = user?.user_metadata?.full_name || user?.email || 'Someone';
    const item = shoppingItems.find(i => i.id === itemId);
    if (!item) return;

    let currentMemberIndex = 0;
    if (typeof item.assigned_member_index === 'number') {
      currentMemberIndex = item.assigned_member_index;
    } else {
      const sortedItems = [...shoppingItems].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const itemIndex = sortedItems.findIndex(sortedItem => sortedItem.id === itemId);
      currentMemberIndex = itemIndex % members.length;
    }
    
    const currentMember = members[currentMemberIndex];
    const assignedMemberName = currentMember?.full_name || currentMember?.email || 'Unknown';
    
    const nextMemberIndex = (currentMemberIndex + 1) % members.length;
    const nextMember = members[nextMemberIndex];
    const nextMemberName = nextMember?.full_name || nextMember?.email || 'next person';
    
    await logShoppingAction('purchased', item.name, assignedMemberName);
    
    await updateShoppingItem(itemId, { 
      is_purchased: false,
      purchased_by: null,
      assigned_member_index: nextMemberIndex
    });
    
    if (onItemUpdated) {
      onItemUpdated();
    }
    
    toast({
      title: t('bought') + "! ✅",
      description: `${item.name} bought by ${assignedMemberName}. Now assigned to ${nextMemberName}.`,
    });
  };

  const handleFlagLow = async (itemId: string) => {
    const currentUserName = user?.user_metadata?.full_name || user?.email || 'Someone';
    const item = shoppingItems.find(i => i.id === itemId);
    if (!item) return;
    
    await logShoppingAction('flagged_low', item.name, currentUserName);
    
    await updateShoppingItem(itemId, { 
      purchased_by: currentUserName
    });
    
    if (onItemUpdated) {
      onItemUpdated();
    }
    
    toast({
      title: t('low_stock'),
      description: "This item has been added to urgent items needed.",
    });
  };

  const isAddButtonDisabled = !selectedHouseholdId || membersLoading || members.length === 0;
  const shouldShowExamplesButton = shoppingItems.length === 0 && selectedHouseholdId && members.length > 0;

  const sortedItems = [...shoppingItems].sort((a, b) => {
    const aFlagged = !a.is_purchased && a.purchased_by;
    const bFlagged = !b.is_purchased && b.purchased_by;
    
    if (aFlagged && !bFlagged) return -1;
    if (!aFlagged && bFlagged) return 1;
    
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const getDisabledTitle = () => {
    if (!selectedHouseholdId) return t('select_household_first');
    if (members.length === 0) return t('no_household_members');
    return t('add_item');
  };

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-gray-100 text-xl">
          <ShoppingCart className="h-5 w-5" />
          {t('shopping_items')}
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
              {t('add_examples')}
            </Button>
          </div>
        )}
        {!selectedHouseholdId ? (
          <div className="text-gray-400 text-center py-4">
            {t('select_household_first')} {t('shopping_items').toLowerCase()}
          </div>
        ) : members.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            {t('no_household_members')}
          </div>
        ) : loading ? (
          <div className="text-gray-400 text-center py-4">
            {t('loading')} {t('shopping_items').toLowerCase()}...
          </div>
        ) : shoppingItems.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            {t('no_shopping_items_yet')}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedItems.map((item) => (
              <ShoppingItemCard
                key={item.id}
                item={item}
                assignedMember={getCurrentAssignedMember(item)}
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
