
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the shopping item types based on the database schema
type ShoppingItem = {
  id: string;
  household_id: string;
  name: string;
  category: string | null;
  quantity: number | null;
  is_purchased: boolean | null;
  purchased_by: string | null;
  assigned_member_index?: number | null; // Make this optional since it doesn't exist in DB yet
  created_at: string;
  updated_at: string;
};

type ShoppingItemInsert = {
  household_id: string;
  name: string;
  category?: string | null;
  quantity?: number | null;
  is_purchased?: boolean | null;
  purchased_by?: string | null;
  assigned_member_index?: number | null;
};

// Type for database response (without assigned_member_index)
type DatabaseShoppingItem = {
  id: string;
  household_id: string;
  name: string;
  category: string | null;
  quantity: number | null;
  is_purchased: boolean | null;
  purchased_by: string | null;
  created_at: string;
  updated_at: string;
};

export const useShoppingItems = (householdId: string | null) => {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchShoppingItems = async () => {
    if (!householdId) {
      setShoppingItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include assigned_member_index if missing
      const transformedData = (data as DatabaseShoppingItem[] || []).map(item => ({
        ...item,
        assigned_member_index: (item as any).assigned_member_index ?? null
      }));
      
      setShoppingItems(transformedData);
    } catch (error) {
      console.error('Error fetching shopping items:', error);
      toast({
        title: "Error loading shopping items",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addShoppingItem = async (name: string) => {
    if (!householdId) return null;

    try {
      const newItem: ShoppingItemInsert = {
        household_id: householdId,
        name,
        is_purchased: false,
        purchased_by: null,
        assigned_member_index: 0, // Start with first member
      };

      const { data, error } = await supabase
        .from('shopping_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      // Transform the returned data to include assigned_member_index
      const transformedData = {
        ...data,
        assigned_member_index: (data as any).assigned_member_index ?? 0
      };

      setShoppingItems(prev => [transformedData, ...prev]);
      toast({
        title: "Shopping item added! 🛒",
        description: `${name} has been added to the shopping list.`,
      });

      return transformedData;
    } catch (error) {
      console.error('Error adding shopping item:', error);
      toast({
        title: "Error adding item",
        description: "Please try again later.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateShoppingItem = async (id: string, updates: Partial<ShoppingItem>) => {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Transform the returned data to include assigned_member_index
      const transformedData = {
        ...data,
        assigned_member_index: (data as any).assigned_member_index ?? updates.assigned_member_index ?? null
      };

      setShoppingItems(prev => 
        prev.map(item => item.id === id ? transformedData : item)
      );

      return transformedData;
    } catch (error) {
      console.error('Error updating shopping item:', error);
      toast({
        title: "Error updating item",
        description: "Please try again later.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteShoppingItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setShoppingItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Shopping item deleted",
        description: "The item has been removed from the list.",
      });
    } catch (error) {
      console.error('Error deleting shopping item:', error);
      toast({
        title: "Error deleting item",
        description: "Please try again later.",
        variant: "destructive",
      });
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
    refreshItems: fetchShoppingItems,
  };
};
