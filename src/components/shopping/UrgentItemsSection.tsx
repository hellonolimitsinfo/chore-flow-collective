
import { Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UrgentItem {
  id: string;
  name: string;
  purchased_by: string | null;
}

interface UrgentItemsSectionProps {
  flaggedItems: UrgentItem[];
  onMarkPurchased: (itemId: string) => void;
}

export const UrgentItemsSection = ({ flaggedItems, onMarkPurchased }: UrgentItemsSectionProps) => {
  if (flaggedItems.length === 0) {
    return null;
  }

  return (
    <Card className="bg-red-900/30 border-red-700 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-red-100 text-lg">
          ⚠️ Urgent Items Needed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {flaggedItems.map(item => (
            <div key={item.id} className="p-3 border border-red-800 rounded-lg bg-red-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-100">{item.name}</h4>
                  <p className="text-sm text-red-300">
                    🟣 {item.purchased_by}'s responsibility
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => onMarkPurchased(item.id)}
                    className="bg-green-700 hover:bg-green-800 text-xs"
                  >
                    Bought
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
