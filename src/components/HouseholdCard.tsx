
import { Users, Settings, Trash2, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Household } from "@/types/household";
import { InviteMemberModal } from "@/components/households/InviteMemberModal";

interface HouseholdCardProps {
  household: Household;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: (householdId: string) => void;
}

export const HouseholdCard = ({ household, isSelected, onSelect, onDelete }: HouseholdCardProps) => {
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm(`Are you sure you want to delete "${household.name}"?`)) {
      onDelete(household.id);
    }
  };

  const handleInviteMembers = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInviteModal(true);
  };

  const canDelete = household.user_role === 'admin';
  const canInvite = household.user_role === 'admin';

  return (
    <>
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
            <div>
              <h3 className="text-lg font-semibold text-white">{household.name}</h3>
              {household.description && (
                <p className="text-sm text-slate-400 mt-1">{household.description}</p>
              )}
            </div>
            <div className="flex space-x-1">
              {canInvite && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleInviteMembers}
                  className="text-green-400 hover:text-green-300"
                  title="Add Members"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                <Settings className="w-4 h-4" />
              </Button>
              {canDelete && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDelete}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center text-slate-400">
            <Users className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>{household.member_count || 0} members</span>
              {household.members && household.members.length > 0 && (
                <div className="text-xs text-slate-500 mt-1">
                  {household.members.map((member, index) => (
                    <span key={member.user_id}>
                      {member.full_name || 'Unknown'}
                      {index < household.members!.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {household.user_role === 'admin' && (
              <span className="ml-auto px-2 py-1 text-xs bg-blue-600 text-white rounded">Admin</span>
            )}
          </div>
        </CardContent>
      </Card>

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        householdId={household.id}
        householdName={household.name}
      />
    </>
  );
};
