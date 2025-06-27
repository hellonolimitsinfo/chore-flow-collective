
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface UrgentItem {
  id: string;
  name: string;
  purchased_by: string | null;
  assigned_member_index?: number | null;
}

interface UrgentItemsSectionProps {
  flaggedItems: UrgentItem[];
  members: Array<{ full_name: string | null; email: string }>;
  onMarkPurchased: (itemId: string) => void;
}

export const UrgentItemsSection = ({ flaggedItems, members, onMarkPurchased }: UrgentItemsSectionProps) => {
  const { t } = useLanguage();
  
  if (flaggedItems.length === 0) {
    return null;
  }

  const getAssignedMember = (item: UrgentItem) => {
    if (members.length === 0) return 'Unknown';
    
    // If the item has an assigned_member_index, use that
    if (typeof item.assigned_member_index === 'number' && item.assigned_member_index < members.length) {
      return members[item.assigned_member_index].full_name || members[item.assigned_member_index].email;
    }
    
    // Fallback to first member
    return members[0].full_name || members[0].email;
  };

  return (
    <Card className="bg-red-900/30 border-red-700 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-red-100 text-lg">
          ⚠️ {t('urgent_items')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {flaggedItems.map(item => {
            const assignedMember = getAssignedMember(item);
            return (
              <div key={item.id} className="p-4 border border-red-800 rounded-lg bg-red-900/20">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-red-100">{item.name}</h4>
                    <p className="text-sm text-red-300">
                      🟣 {assignedMember}{t('responsibility')}
                    </p>
                    <p className="text-xs text-red-400">
                      {t('flagged_by_user')}: {item.purchased_by}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-red-300">
                      {assignedMember}{t('responsibility')}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onMarkPurchased(item.id)}
                    className="bg-green-700 hover:bg-green-800"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {t('bought')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
