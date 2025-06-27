import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Clock, CheckCircle, ShoppingCart, CreditCard, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface HistoryItem {
  id: string;
  type: 'chore' | 'shopping_purchased' | 'shopping_flagged' | 'payment_claimed' | 'payment_confirmed';
  name: string;
  completed_by: string;
  completed_at: string;
  expense_description?: string;
}

interface HistorySectionProps {
  selectedHouseholdId: string | null;
  refreshTrigger?: number; // Add refresh trigger prop
}

export const HistorySection = ({ selectedHouseholdId, refreshTrigger }: HistorySectionProps) => {
  const { t } = useLanguage();
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
      // Fetch completed chores with user names
      const { data: choreCompletions, error: choreError } = await supabase
        .from('chore_completions')
        .select(`
          id,
          completed_by,
          completed_at,
          chore_id,
          chores!inner(name, household_id),
          profiles!chore_completions_completed_by_fkey(full_name, email)
        `)
        .eq('chores.household_id', selectedHouseholdId)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (choreError) throw choreError;

      // Fetch shopping logs
      const { data: shoppingLogs, error: shoppingError } = await supabase
        .from('shopping_logs')
        .select('id, action, item_name, member_name, created_at')
        .eq('household_id', selectedHouseholdId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (shoppingError) throw shoppingError;

      // Fetch payment logs
      const { data: paymentLogs, error: paymentError } = await supabase
        .from('payment_logs')
        .select('id, member_name, action, expense_description, created_at')
        .eq('household_id', selectedHouseholdId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (paymentError) throw paymentError;

      // Combine and format the data
      const choreHistory: HistoryItem[] = (choreCompletions || []).map(completion => ({
        id: completion.id,
        type: 'chore' as const,
        name: completion.chores.name,
        completed_by: completion.profiles?.full_name || completion.profiles?.email || 'Unknown',
        completed_at: completion.completed_at,
      }));

      const shoppingHistory: HistoryItem[] = (shoppingLogs || []).map(log => ({
        id: log.id,
        type: log.action === 'purchased' ? 'shopping_purchased' as const : 'shopping_flagged' as const,
        name: log.item_name,
        completed_by: log.member_name,
        completed_at: log.created_at,
      }));

      const paymentHistory: HistoryItem[] = (paymentLogs || []).map(log => ({
        id: log.id,
        type: log.action === 'claimed' ? 'payment_claimed' as const : 'payment_confirmed' as const,
        name: log.expense_description,
        completed_by: log.member_name,
        completed_at: log.created_at,
        expense_description: log.expense_description,
      }));

      // Combine and sort by date
      const allHistory = [...choreHistory, ...shoppingHistory, ...paymentHistory]
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

  // Auto-refresh when refreshTrigger changes
  useEffect(() => {
    if (isOpen && refreshTrigger) {
      fetchHistory();
    }
  }, [refreshTrigger]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ', ' + date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'chore':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'shopping_purchased':
        return <ShoppingCart className="h-5 w-5 text-blue-400" />;
      case 'shopping_flagged':
        return <Flag className="h-5 w-5 text-yellow-400" />;
      case 'payment_claimed':
        return <CreditCard className="h-5 w-5 text-yellow-400" />;
      case 'payment_confirmed':
        return <CreditCard className="h-5 w-5 text-green-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getItemDescription = (item: HistoryItem) => {
    switch (item.type) {
      case 'chore':
        return `${t('completed_by')} ${item.completed_by}`;
      case 'shopping_purchased':
        return `${t('purchased_by')} ${item.completed_by}`;
      case 'shopping_flagged':
        return `${t('flagged_by')} ${item.completed_by}`;
      case 'payment_claimed':
        return `${item.completed_by} ${t('says_paid')}`;
      case 'payment_confirmed':
        return `${t('payment_confirmed')} ${item.completed_by}`;
      default:
        return `By ${item.completed_by}`;
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
                  <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-3 border border-gray-700 rounded-lg bg-gray-800/50">
                    <div className="flex-shrink-0">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-200">{item.name}</h4>
                      </div>
                      <p className="text-sm text-gray-400 mb-1">
                        {getItemDescription(item)}
                      </p>
                      <div className="text-xs text-gray-500">
                        {formatDateTime(item.completed_at)}
                      </div>
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
