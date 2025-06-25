
import { useState } from "react";
import { Edit3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  currentName: string;
  onRename: (householdId: string, newName: string) => Promise<boolean>;
}

export const RenameHouseholdModal = ({ 
  isOpen, 
  onClose, 
  householdId, 
  currentName,
  onRename 
}: RenameHouseholdModalProps) => {
  const [newName, setNewName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  const handleRename = async () => {
    if (!newName.trim() || newName.trim() === currentName) {
      return;
    }

    setIsLoading(true);
    const success = await onRename(householdId, newName.trim());
    
    if (success) {
      onClose();
    }
    
    setIsLoading(false);
  };

  const handleClose = () => {
    setNewName(currentName);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Rename Household
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="household-name">Household Name</Label>
            <Input
              id="household-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                }
              }}
              placeholder="Enter new household name"
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleRename} 
              disabled={isLoading || !newName.trim() || newName.trim() === currentName}
            >
              {isLoading ? "Renaming..." : "Rename"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
