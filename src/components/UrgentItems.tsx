import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ShoppingItem {
  id: string;
  name: string;
  isLow: boolean;
  flaggedBy?: string;
  assignedTo: number;
}

interface HouseholdMember {
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface UrgentItemsProps {
  shoppingItems: ShoppingItem[];
  members: HouseholdMember[];
  onShoppingComplete: (itemId: string) => void;
}

export const UrgentItems = ({ shoppingItems, members, onShoppingComplete }: UrgentItemsProps) => {
  const urgentShoppingItems = shoppingItems.filter(item => item.isLow);

  if (urgentShoppingItems.length === 0) {
    return null;
  }

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

  const handleBoughtClick = (itemId: string) => {
    onShoppingComplete(itemId);
  };

  return (
    <Card className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-600/50">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-200">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Urgent Items Needed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {urgentShoppingItems.map((item) => {
          const assignedMember = members[item.assignedTo % members.length];
          const assigneeName = assignedMember?.full_name || assignedMember?.email || 'Unknown';
          
          return (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-white">{item.name}</h4>
                <p className="text-sm text-slate-400">
                  {item.flaggedBy ? `Flagged by ${item.flaggedBy}` : 'Flagged as low stock'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-3 h-3 rounded-full ${getAssigneeColor(assigneeName)}`}></div>
                  <p className="text-sm text-green-400">{assigneeName}'s turn</p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => handleBoughtClick(item.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                Bought
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
