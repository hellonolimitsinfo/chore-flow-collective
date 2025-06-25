
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type ShoppingItem = Database['public']['Tables']['shopping_items']['Row'];
type ShoppingItemInsert = Database['public']['Tables']['shopping_items']['Insert'];

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
      setShoppingItems(data || []);
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

  const addShoppingItem = async (name: string, category: string = 'other') => {
    if (!householdId) return null;

    try {
      const newItem: ShoppingItemInsert = {
        household_id: householdId,
        name,
        category,
        quantity: 1,
        is_purchased: false,
      };

      const { data, error } = await supabase
        .from('shopping_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      setShoppingItems(prev => [data, ...prev]);
      toast({
        title: "Shopping item added! 🛒",
        description: `${name} has been added to the shopping list.`,
      });

      return data;
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

      setShoppingItems(prev => 
        prev.map(item => item.id === id ? data : item)
      );

      return data;
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

  const markAsPurchased = async (id: string, purchasedBy: string) => {
    const updates = {
      is_purchased: true,
      purchased_by: purchasedBy,
    };

    const result = await updateShoppingItem(id, updates);
    
    if (result) {
      toast({
        title: "Item marked as purchased! ✅",
        description: "Thanks for getting the supplies!",
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
    markAsPurchased,
    refreshItems: fetchShoppingItems,
  };
};
