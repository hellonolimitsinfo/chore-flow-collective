
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Clock, CheckCircle, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  id: string;
  type: 'chore' | 'shopping';
  name: string;
  completed_by: string;
  completed_at: string;
}

interface HistorySectionProps {
  selectedHouseholdId: string | null;
}

export const HistorySection = ({ selectedHouseholdId }: HistorySectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    if (!selectedHouseholdId) {
      setHistoryItems([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch completed chores
      const { data: choreCompletions, error: choreError } = await supabase
        .from('chore_completions')
        .select(`
          id,
          completed_by,
          completed_at,
          chore_id,
          chores!inner(name, household_id)
        `)
        .eq('chores.household_id', selectedHouseholdId)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (choreError) throw choreError;

      // Fetch purchased shopping items
      const { data: shoppingItems, error: shoppingError } = await supabase
        .from('shopping_items')
        .select('id, name, purchased_by, updated_at')
        .eq('household_id', selectedHouseholdId)
        .eq('is_purchased', true)
        .not('purchased_by', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (shoppingError) throw shoppingError;

      // Combine and format the data
      const choreHistory: HistoryItem[] = (choreCompletions || []).map(completion => ({
        id: completion.id,
        type: 'chore' as const,
        name: completion.chores.name,
        completed_by: completion.completed_by,
        completed_at: completion.completed_at,
      }));

      const shoppingHistory: HistoryItem[] = (shoppingItems || []).map(item => ({
        id: item.id,
        type: 'shopping' as const,
        name: item.name,
        completed_by: item.purchased_by!,
        completed_at: item.updated_at,
      }));

      // Combine and sort by date
      const allHistory = [...choreHistory, ...shoppingHistory]
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

      setHistoryItems(allHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error loading history",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [selectedHouseholdId, isOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  };

  if (!selectedHouseholdId) {
    return null;
  }

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-gray-700/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-gray-100 text-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                History
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
                Loading history...
              </div>
            ) : historyItems.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                No completed tasks yet
              </div>
            ) : (
              <div className="space-y-3">
                {historyItems.map(item => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-3 border border-gray-700 rounded-lg bg-gray-800/50">
                    <div className="flex-shrink-0">
                      {item.type === 'chore' ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <ShoppingCart className="h-5 w-5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-200">{item.name}</h4>
                        <span className="text-xs text-gray-400">
                          {formatDate(item.completed_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {item.type === 'chore' ? 'Completed' : 'Purchased'} by {item.completed_by}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
