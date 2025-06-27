
import { CheckCircle, ShoppingCart, Flag, CreditCard, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface HistoryItemProps {
  item: {
    id: string;
    type: 'chore' | 'shopping_purchased' | 'shopping_flagged' | 'payment_claimed' | 'payment_confirmed';
    name: string;
    completed_by: string;
    completed_at: string;
    expense_description?: string;
  };
}

export const HistoryItem = ({ item }: HistoryItemProps) => {
  const { t } = useLanguage();

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

  const getItemDescription = (item: HistoryItemProps['item']) => {
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

  return (
    <div className="flex items-center gap-3 p-3 border border-gray-700 rounded-lg bg-gray-800/50">
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
  );
};
