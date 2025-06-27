
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useShoppingActions = (selectedHouseholdId: string | null) => {
  const { toast } = useToast();

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
    } catch (error) {
      console.error('Error logging shopping action:', error);
    }
  };

  const handleUrgentItemBought = async (
    itemId: string, 
    shoppingItems: any[], 
    members: any[], 
    user: any,
    updateShoppingItem: any,
    refreshItems: any
  ) => {
    const currentUserName = user?.user_metadata?.full_name || user?.email || 'Someone';
    const item = shoppingItems.find((i: any) => i.id === itemId);
    
    if (!item || !members.length) return;
    
    try {
      // Get current assigned member index
      let currentMemberIndex = 0;
      if (typeof item.assigned_member_index === 'number') {
        currentMemberIndex = item.assigned_member_index;
      } else {
        // Calculate based on creation order if not set
        const sortedItems = [...shoppingItems].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const itemIndex = sortedItems.findIndex((sortedItem: any) => sortedItem.id === itemId);
        currentMemberIndex = itemIndex % members.length;
      }
      
      // Get current assigned member name for logging
      const currentMember = members[currentMemberIndex];
      const assignedMemberName = currentMember?.full_name || currentMember?.email || 'Unknown';
      
      // Calculate next member index
      const nextMemberIndex = (currentMemberIndex + 1) % members.length;
      const nextMember = members[nextMemberIndex];
      const nextMemberName = nextMember?.full_name || nextMember?.email || 'next person';
      
      // Log the shopping action with the assigned member who was supposed to buy it
      await logShoppingAction('purchased', item.name, assignedMemberName);
      
      // Reset item to default state and assign to next person
      await updateShoppingItem(itemId, { 
        is_purchased: false,
        purchased_by: null,
        assigned_member_index: nextMemberIndex
      });

      // Refresh the shopping items to ensure both sections are updated
      refreshItems();
      
      toast({
        title: "Item purchased! ✅",
        description: `${item.name} bought by ${assignedMemberName}. Now assigned to ${nextMemberName}.`,
      });
    } catch (error) {
      console.error('Error handling urgent item bought:', error);
      toast({
        title: "Error",
        description: "Failed to update shopping item",
        variant: "destructive",
      });
    }
  };

  return { logShoppingAction, handleUrgentItemBought };
};
