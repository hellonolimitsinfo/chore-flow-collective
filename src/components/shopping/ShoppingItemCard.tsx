
import { CheckCircle, MoreHorizontal, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ShoppingItemCardProps {
  item: {
    id: string;
    name: string;
    quantity: number | null;
    is_purchased: boolean | null;
    purchased_by: string | null;
  };
  onMarkPurchased: (itemId: string) => void;
  onFlagLow: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

export const ShoppingItemCard = ({ item, onMarkPurchased, onFlagLow, onDelete }: ShoppingItemCardProps) => {
  return (
    <div className={`p-4 border rounded-lg transition-all ${
      item.is_purchased ? 'border-green-800 bg-green-900/30' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-700/50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-200">{item.name}</h3>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
              <DropdownMenuItem 
                onClick={() => onDelete(item.id)}
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
          <span className="text-sm text-gray-300">
            Quantity: {item.quantity}
          </span>
        </div>
        
        <div className="flex gap-2">
          {!item.is_purchased ? (
            <>
              <Button 
                size="sm" 
                onClick={() => onFlagLow(item.id)}
                variant="outline"
                className="border-amber-600 text-amber-300 hover:bg-amber-700/20"
              >
                <Flag className="h-4 w-4 mr-1" />
                Flag Low
              </Button>
              <Button 
                size="sm" 
                onClick={() => onMarkPurchased(item.id)}
                className="bg-green-700 hover:bg-green-800"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Bought
              </Button>
            </>
          ) : (
            <span className="text-sm text-green-400">
              ✅ Purchased{item.purchased_by ? ` by ${item.purchased_by}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
