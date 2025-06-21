
import { ShoppingCart, Plus, CheckCircle, Flag, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/useTheme";

export const ShoppingSection = () => {
  const { theme } = useTheme();
  
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
    <Card className={theme === 'light' ? 'bg-white border-[#ddd] shadow-sm' : 'bg-slate-800 border-slate-700'}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className={`flex items-center ${theme === 'light' ? 'text-[#111111]' : 'text-white'}`}>
          <ShoppingCart className="w-5 h-5 mr-2" />
          Shopping Items
        </CardTitle>
        <Button 
          size="sm" 
          className={theme === 'light' ? 'bg-[#007BFF] hover:bg-[#0056b3] text-white shadow-sm' : 'bg-blue-600 hover:bg-blue-700'}
        >
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
                ? (theme === 'light' ? 'bg-red-50 border border-red-200' : 'bg-red-900/30 border border-red-600/50')
                : (theme === 'light' ? 'bg-[#fafafa] border border-[#ddd]' : 'bg-slate-700/50')
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-medium ${theme === 'light' ? 'text-[#111111]' : 'text-white'}`}>{item.title}</h4>
              <div className="flex items-center space-x-1">
                {item.urgency === 'high' && (
                  <Badge className={theme === 'light' ? 'bg-red-600 text-white' : 'bg-red-600 text-white'}>
                    {item.status}
                  </Badge>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={theme === 'light' ? 'text-[#666666] hover:text-[#111111]' : 'text-slate-400'}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${
                theme === 'light' 
                  ? (item.color === 'green' ? 'text-green-600' : 'text-purple-600')
                  : `text-${item.color}-400`
              }`}>
                {item.assignee}
              </span>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={theme === 'light' ? 'border-[#ddd] text-[#666666] bg-white hover:bg-gray-50' : 'border-slate-600 text-slate-300'}
                >
                  <Flag className="w-4 h-4 mr-1" />
                  Flag Low
                </Button>
                <Button 
                  size="sm" 
                  className={theme === 'light' ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm' : 'bg-green-600 hover:bg-green-700'}
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
