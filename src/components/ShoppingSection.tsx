
import { ShoppingCart, Plus, CheckCircle, Flag, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const ShoppingSection = () => {
  const shoppingItems = [
    {
      id: 1,
      title: "Toilet Paper",
      assignee: "Sam's responsibility",
      status: "Low Stock",
      urgency: "high",
      color: "green",
      completed: false
    },
    {
      id: 2,
      title: "Dish Soap",
      assignee: "Jordan's responsibility",
      status: "Normal",
      urgency: "normal",
      color: "purple",
      completed: false
    },
    {
      id: 3,
      title: "Milk",
      assignee: "Sam's responsibility",
      status: "Normal",
      urgency: "normal",
      color: "green",
      completed: false
    },
    {
      id: 4,
      title: "Cleaning Supplies",
      assignee: "Jordan's responsibility",
      status: "Normal",
      urgency: "normal",
      color: "purple",
      completed: false
    }
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-white">
          <ShoppingCart className="w-5 h-5 mr-2" />
          Shopping Items
        </CardTitle>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {shoppingItems.map((item) => (
          <div 
            key={item.id} 
            className={`p-3 rounded-lg ${
              item.urgency === 'high' 
                ? 'bg-red-900/30 border border-red-600/50' 
                : 'bg-slate-700/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-white">{item.title}</h4>
              <div className="flex items-center space-x-1">
                {item.urgency === 'high' && (
                  <Badge className="bg-red-600 text-white">
                    {item.status}
                  </Badge>
                )}
                <Button size="sm" variant="ghost" className="text-slate-400">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm text-${item.color}-400`}>
                {item.assignee}
              </span>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                  <Flag className="w-4 h-4 mr-1" />
                  Flag Low
                </Button>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Bought
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
