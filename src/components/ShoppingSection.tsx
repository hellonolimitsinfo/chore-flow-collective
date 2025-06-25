
import { RotateCcw, Plus, CheckCircle, AlertTriangle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShoppingItem {
  id: string;
  name: string;
  isLow: boolean;
  flaggedBy?: string;
  assignedTo: number;
}

interface ShoppingItemFormValues {
  name: string;
}

export const ShoppingSection = () => {
  const { toast } = useToast();
  
  const shoppingForm = useForm<ShoppingItemFormValues>({
    defaultValues: {
      name: ""
    }
  });

  const flatmates = [
    { id: "1", name: "Alex", color: "bg-blue-500" },
    { id: "2", name: "Sam", color: "bg-green-500" },
    { id: "3", name: "Jordan", color: "bg-purple-500" },
  ];

  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([
    { id: "1", name: "Toilet Paper", isLow: true, flaggedBy: "Sam", assignedTo: 1 },
    { id: "2", name: "Dish Soap", isLow: false, assignedTo: 2 },
    { id: "3", name: "Milk", isLow: true, flaggedBy: "Alex", assignedTo: 0 },
    { id: "4", name: "Cleaning Supplies", isLow: false, assignedTo: 1 },
  ]);

  const completeShopping = (itemId: string) => {
    setShoppingItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const nextAssignee = (item.assignedTo + 1) % flatmates.length;
        return {
          ...item,
          isLow: false,
          flaggedBy: undefined,
          assignedTo: nextAssignee
        };
      }
      return item;
    }));

    toast({
      title: "Shopping completed! 🛒",
      description: "Thanks for getting the supplies! Assignment rotated.",
    });
  };

  const deleteShoppingItem = (itemId: string) => {
    setShoppingItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Shopping item deleted",
      description: "The item has been removed from the list.",
    });
  };

  const flagItem = (itemId: string, flaggerName: string) => {
    setShoppingItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          isLow: true,
          flaggedBy: flaggerName
        };
      }
      return item;
    }));

    toast({
      title: "Item flagged as low! ⚠️",
      description: `${flaggerName} flagged this item as running low.`,
    });
  };

  const addNewShoppingItem = (values: ShoppingItemFormValues) => {
    const newItem: ShoppingItem = {
      id: `${shoppingItems.length + 1}`,
      name: values.name,
      isLow: false,
      assignedTo: 0
    };
    
    setShoppingItems(prev => [...prev, newItem]);
    
    toast({
      title: "New shopping item added! 🛒",
      description: `${values.name} has been added to the shopping list.`,
    });
    
    shoppingForm.reset();
  };

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-gray-100">
          <RotateCcw className="h-5 w-5" />
          Shopping Items
        </CardTitle>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm" className="h-8 bg-blue-700 hover:bg-blue-800">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-gray-800 border-gray-700 w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="text-gray-100">Add Shopping Item</SheetTitle>
              <SheetDescription className="text-gray-400">
                Add a new item to the shopping list. Once added, the item will be assigned to the first flatmate.
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
        <div className="space-y-4">
          {shoppingItems.map(item => (
            <div key={item.id} className={`p-4 border rounded-lg transition-all ${
              item.isLow ? 'border-red-800 bg-red-900/30' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-700/50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-200">{item.name}</h3>
                <div className="flex items-center gap-2">
                  {item.isLow && (
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
                  <div className={`w-3 h-3 rounded-full ${flatmates[item.assignedTo].color}`}></div>
                  <span className="text-sm text-gray-300">
                    {flatmates[item.assignedTo].name}'s responsibility
                  </span>
                </div>
                
                <div className="flex gap-2">
                  {!item.isLow && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => flagItem(item.id, flatmates[0].name)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Flag Low
                    </Button>
                  )}
                  {item.isLow && (
                    <Button 
                      size="sm" 
                      onClick={() => completeShopping(item.id)}
                      className="bg-green-700 hover:bg-green-800"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Bought
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
