
import { Users, Settings, Trash2, UserPlus, Edit3, UserMinus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import type { Household } from "@/types/household";
import { InviteMemberModal } from "@/components/households/InviteMemberModal";
import { HouseholdMembersModal } from "@/components/households/HouseholdMembersModal";
import { RenameHouseholdModal } from "@/components/households/RenameHouseholdModal";
import { useLanguage } from "@/contexts/LanguageContext";

interface HouseholdCardProps {
  household: Household;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: (householdId: string) => void;
  onRename?: (householdId: string, newName: string) => Promise<boolean>;
  onRemoveMember?: (householdId: string, userId: string) => Promise<boolean>;
}

export const HouseholdCard = ({ 
  household, 
  isSelected, 
  onSelect, 
  onDelete, 
  onRename,
  onRemoveMember 
}: HouseholdCardProps) => {
  const { t } = useLanguage();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);

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

  const handleViewMembers = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMembersModal(true);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRenameModal(true);
  };

  const canDelete = household.user_role === 'admin';
  const canInvite = household.user_role === 'admin';
  const canRename = household.user_role === 'admin';
  const canManageMembers = household.user_role === 'admin';

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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-400 hover:text-gray-200 border-gray-600 hover:border-gray-300 px-3 py-2"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                {canInvite && (
                  <DropdownMenuItem 
                    onClick={handleInviteMembers}
                    className="text-green-400 hover:text-green-300 hover:bg-gray-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Members
                  </DropdownMenuItem>
                )}
                {canManageMembers && (
                  <DropdownMenuItem 
                    onClick={handleViewMembers}
                    className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Manage Members
                  </DropdownMenuItem>
                )}
                {canRename && (
                  <DropdownMenuItem 
                    onClick={handleRename}
                    className="text-orange-400 hover:text-orange-300 hover:bg-gray-700"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Rename Household
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Household
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center text-slate-400">
            <Users className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>{household.member_count || 0} {t('members')}</span>
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
              <span className="ml-auto px-2 py-1 text-xs bg-blue-600 text-white rounded">{t('admin')}</span>
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

      {onRemoveMember && (
        <HouseholdMembersModal
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          householdId={household.id}
          householdName={household.name}
          userRole={household.user_role || 'member'}
          onRemoveMember={(userId) => onRemoveMember(household.id, userId)}
        />
      )}

      {onRename && (
        <RenameHouseholdModal
          isOpen={showRenameModal}
          onClose={() => setShowRenameModal(false)}
          householdId={household.id}
          currentName={household.name}
          onRename={onRename}
        />
      )}
    </>
  );
};
