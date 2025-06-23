
import { useState } from "react";
import { Mail, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  householdName: string;
}

export const InviteMemberModal = ({ isOpen, onClose, householdId, householdName }: InviteMemberModalProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to send invitations");
      return;
    }

    setIsLoading(true);

    try {
      // Get user's profile to include inviter name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const inviterName = profile?.full_name || user.email?.split('@')[0] || 'Someone';

      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          householdId,
          householdName,
          inviteEmail: email.trim(),
          inviterName
        }
      });

      if (error) {
        throw error;
      }

      toast.success(`Invitation sent to ${email}!`);
      setEmail("");
      onClose();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Add Members to {householdName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendInvitation();
                }
              }}
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSendInvitation} disabled={isLoading || !email.trim()}>
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
