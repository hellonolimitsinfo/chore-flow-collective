
import { Users, Settings, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

interface Household {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
  user_role?: string;
}

interface HouseholdCardProps {
  household: Household;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: (householdId: string) => void;
}

export const HouseholdCard = ({ household, isSelected, onSelect, onDelete }: HouseholdCardProps) => {
  const { theme } = useTheme();
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm(`Are you sure you want to delete "${household.name}"?`)) {
      onDelete(household.id);
    }
  };

  const canDelete = household.user_role === 'admin';

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
        theme === 'light'
          ? (isSelected 
              ? 'bg-blue-50 border-blue-300 shadow-md' 
              : 'bg-white border-[#ddd] hover:bg-gray-50 shadow-sm')
          : (isSelected 
              ? 'bg-blue-900/50 border-blue-500 shadow-lg shadow-blue-500/20' 
              : 'bg-slate-800 border-slate-700 hover:bg-slate-750')
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-lg font-semibold ${theme === 'light' ? 'text-[#111111]' : 'text-white'}`}>{household.name}</h3>
            {household.description && (
              <p className={`text-sm mt-1 ${theme === 'light' ? 'text-[#666666]' : 'text-slate-400'}`}>{household.description}</p>
            )}
          </div>
          <div className="flex space-x-1">
            <Button 
              size="sm" 
              variant="ghost" 
              className={theme === 'light' ? 'text-[#666666] hover:text-[#111111] hover:bg-gray-100' : 'text-slate-400 hover:text-white'}
            >
              <Settings className="w-4 h-4" />
            </Button>
            {canDelete && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleDelete}
                className={theme === 'light' ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-red-400 hover:text-red-300'}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className={`flex items-center ${theme === 'light' ? 'text-[#666666]' : 'text-slate-400'}`}>
          <Users className="w-4 h-4 mr-2" />
          <span>{household.member_count || 0} members</span>
          {household.user_role === 'admin' && (
            <span className={`ml-2 px-2 py-1 text-xs rounded ${
              theme === 'light' ? 'bg-blue-100 text-blue-800' : 'bg-blue-600 text-white'
            }`}>Admin</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
