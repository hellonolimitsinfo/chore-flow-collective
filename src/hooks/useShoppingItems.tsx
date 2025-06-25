
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ShoppingItem {
  id: string;
  household_id: string;
  name: string;
  is_low: boolean;
  flagged_by?: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
}

export const useShoppingItems = (householdId: string | null) => {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchShoppingItems = async () => {
    if (!householdId) {
      setShoppingItems([]);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching shopping items for household:', householdId);
      
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shopping items:', error);
        throw error;
      }

      console.log('Fetched shopping items:', data);
      setShoppingItems(data || []);
    } catch (error) {
      console.error('Error fetching shopping items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shopping items",
        variant: "destructive"
      });
      setShoppingItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addShoppingItem = async (name: string, assignedTo: string) => {
    if (!householdId) return null;

    try {
      console.log('Adding shopping item:', { name, assignedTo, householdId });
      
      const { data, error } = await supabase
        .from('shopping_items')
        .insert({
          household_id: householdId,
          name: name.trim(),
          assigned_to: assignedTo,
          is_low: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding shopping item:', error);
        throw error;
      }

      console.log('Added shopping item:', data);
      await fetchShoppingItems();
      
      toast({
        title: "Shopping item added! 🛒",
        description: `${name} has been added to the shopping list.`,
      });

      return data;
    } catch (error) {
      console.error('Error adding shopping item:', error);
      toast({
        title: "Error",
        description: "Failed to add shopping item",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateShoppingItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
    try {
      console.log('Updating shopping item:', itemId, updates);
      
      const { error } = await supabase
        .from('shopping_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating shopping item:', error);
        throw error;
      }

      await fetchShoppingItems();
      return true;
    } catch (error) {
      console.error('Error updating shopping item:', error);
      toast({
        title: "Error",
        description: "Failed to update shopping item",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteShoppingItem = async (itemId: string) => {
    try {
      console.log('Deleting shopping item:', itemId);
      
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting shopping item:', error);
        throw error;
      }

      await fetchShoppingItems();
      
      toast({
        title: "Shopping item deleted",
        description: "The item has been removed from the list.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting shopping item:', error);
      toast({
        title: "Error",
        description: "Failed to delete shopping item",
        variant: "destructive"
      });
      return false;
    }
  };

  const flagItemAsLow = async (itemId: string, flaggedBy: string) => {
    const success = await updateShoppingItem(itemId, {
      is_low: true,
      flagged_by: flaggedBy
    });

    if (success) {
      toast({
        title: "Item flagged as low! ⚠️",
        description: "This item has been flagged as running low.",
      });
    }

    return success;
  };

  const markItemAsBought = async (itemId: string, members: any[]) => {
    if (members.length === 0) return false;

    const currentItem = shoppingItems.find(item => item.id === itemId);
    if (!currentItem) return false;

    const currentAssigneeIndex = members.findIndex(member => member.user_id === currentItem.assigned_to);
    const nextAssigneeIndex = (currentAssigneeIndex + 1) % members.length;
    const nextAssignee = members[nextAssigneeIndex];

    const success = await updateShoppingItem(itemId, {
      is_low: false,
      flagged_by: null,
      assigned_to: nextAssignee.user_id
    });

    if (success) {
      toast({
        title: "Shopping completed! 🛒",
        description: "Thanks for getting the supplies! Assignment rotated.",
      });
    }

    return success;
  };

  const addExampleItems = async (members: any[]) => {
    if (!householdId || members.length === 0) return false;

    try {
      const exampleItems = [
        { name: "Toilet Paper", assigned_to: members[0].user_id },
        { name: "Dish Soap", assigned_to: members[1 % members.length].user_id },
        { name: "Milk", assigned_to: members[2 % members.length].user_id },
        { name: "Cleaning Supplies", assigned_to: members[3 % members.length].user_id },
      ];

      const { error } = await supabase
        .from('shopping_items')
        .insert(exampleItems.map(item => ({
          household_id: householdId,
          name: item.name,
          assigned_to: item.assigned_to,
          is_low: false
        })));

      if (error) {
        console.error('Error adding example items:', error);
        throw error;
      }

      await fetchShoppingItems();
      
      toast({
        title: "Example shopping items added! 🛒",
        description: "Sample items have been added to get you started.",
      });

      return true;
    } catch (error) {
      console.error('Error adding example items:', error);
      toast({
        title: "Error",
        description: "Failed to add example items",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchShoppingItems();
  }, [householdId]);

  return {
    shoppingItems,
    loading,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    flagItemAsLow,
    markItemAsBought,
    addExampleItems,
    refetch: fetchShoppingItems
  };
};
