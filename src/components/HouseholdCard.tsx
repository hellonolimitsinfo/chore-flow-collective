
import { Users, Settings, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Household {
  id: number;
  name: string;
  memberCount: number;
}

interface HouseholdCardProps {
  household: Household;
  isSelected: boolean;
  onSelect: () => void;
}

export const HouseholdCard = ({ household, isSelected, onSelect }: HouseholdCardProps) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
        isSelected 
          ? 'bg-blue-900/50 border-blue-500 shadow-lg shadow-blue-500/20' 
          : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{household.name}</h3>
          <div className="flex space-x-1">
            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center text-slate-400">
          <Users className="w-4 h-4 mr-2" />
          <span>{household.memberCount} members</span>
        </div>
      </CardContent>
    </Card>
  );
};
