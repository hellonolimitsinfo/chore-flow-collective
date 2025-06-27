
import { useState } from "react";
import { ChevronDown, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";
import { HistoryItem } from "@/components/history/HistoryItem";
import { useHistoryData } from "@/components/history/useHistoryData";

interface HistorySectionProps {
  selectedHouseholdId: string | null;
}

export const HistorySection = ({ selectedHouseholdId }: HistorySectionProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { historyItems, loading } = useHistoryData(selectedHouseholdId, isOpen);

  if (!selectedHouseholdId) {
    return null;
  }

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-gray-700/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-gray-100 text-xl">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('history')}
              </div>
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {loading ? (
              <div className="text-gray-400 text-center py-4">
                {t('loading')}
              </div>
            ) : historyItems.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                No completed tasks yet
              </div>
            ) : (
              <div className="space-y-3">
                {historyItems.map(item => (
                  <HistoryItem key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
