
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ShoppingCart, Flag } from "lucide-react";
import { useShoppingItems } from "@/hooks/useShoppingItems";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";

interface ShoppingSectionProps {
  selectedHouseholdId: string | null;
  onItemsChange?: (items: any[]) => void;
}

export const ShoppingSection = ({ selectedHouseholdId, onItemsChange }: ShoppingSectionProps) => {
  const [newItemName, setNewItemName] = useState("");
  const { shoppingItems, loading, addShoppingItem, flagItemAsLow, markItemAsBought } = useShoppingItems(selectedHouseholdId);
  const { members } = useHouseholdMembers(selectedHouseholdId);

  // Call onItemsChange when shopping items change
  React.useEffect(() => {
    if (onItemsChange && shoppingItems) {
      onItemsChange(shoppingItems);
    }
  }, [shoppingItems, onItemsChange]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !selectedHouseholdId) return;

    const success = await addShoppingItem(newItemName.trim(), members);
    if (success) {
      setNewItemName("");
    }
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

  const addExampleItems = async () => {
    if (!selectedHouseholdId) return;
    
    const examples = ['Milk', 'Bread', 'Eggs', 'Cheese', 'Apples'];
    for (const item of examples) {
      await addShoppingItem(item, members);
    }
  };

  if (!selectedHouseholdId) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-300">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Shopping List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Select a household to view shopping list</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-slate-300">
          <div className="flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Shopping List
          </div>
          <Button 
            onClick={addExampleItems}
            size="sm"
            variant="outline"
            className="text-xs px-2 py-1 h-6 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Add Examples
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAddItem} className="flex gap-2">
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add shopping item..."
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
          />
          <Button type="submit" size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </form>

        {loading ? (
          <div className="text-slate-400">Loading shopping items...</div>
        ) : shoppingItems.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {shoppingItems.map((item) => {
              const assignedMember = members.find(member => member.user_id === item.assigned_to);
              const assigneeName = assignedMember?.full_name || assignedMember?.email || 'Unknown';
              
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-3 h-3 rounded-full ${getAssigneeColor(assigneeName)}`}></div>
                      <p className="text-sm text-green-400">{assigneeName}'s turn</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!item.is_low && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => flagItemAsLow(item.id)}
                        className="text-orange-400 border-orange-400 hover:bg-orange-400 hover:text-white"
                      >
                        <Flag className="w-3 h-3" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      onClick={() => markItemAsBought(item.id, members)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Bought
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-slate-400">No shopping items yet</div>
        )}
      </CardContent>
    </Card>
  );
};
