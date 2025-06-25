
import { useState } from "react";
import { Users, Trash2, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import { useAuth } from "@/hooks/useAuth";

interface HouseholdMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  householdName: string;
  userRole: string;
  onRemoveMember: (userId: string) => Promise<boolean>;
}

export const HouseholdMembersModal = ({ 
  isOpen, 
  onClose, 
  householdId, 
  householdName, 
  userRole,
  onRemoveMember 
}: HouseholdMembersModalProps) => {
  const { members, loading, refetch } = useHouseholdMembers(householdId);
  const { user } = useAuth();
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this household?`)) {
      return;
    }

    setRemovingMember(userId);
    const success = await onRemoveMember(userId);
    
    if (success) {
      await refetch(); // Refresh the member list
    }
    
    setRemovingMember(null);
  };

  const canRemoveMembers = userRole === 'admin';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {householdName} Members
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No members found</div>
          ) : (
            members.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {member.role === 'admin' && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="font-medium">
                      {member.full_name || 'Unknown'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {member.email}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-secondary px-2 py-1 rounded capitalize">
                    {member.role}
                  </span>
                  
                  {canRemoveMembers && member.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user_id, member.full_name || 'Unknown')}
                      disabled={removingMember === member.user_id}
                      className="text-destructive hover:text-destructive"
                    >
                      {removingMember === member.user_id ? (
                        "Removing..."
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
