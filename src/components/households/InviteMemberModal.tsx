
import { useState } from "react";
import { Mail, X, Copy, Check, Link, ArrowLeft } from "lucide-react";
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
  const [inviteToken, setInviteToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(true);
  const { user } = useAuth();

  const generateInviteLink = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join?token=${token}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("✅ Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const generateInviteOnly = async () => {
    if (!user) {
      toast.error("You must be logged in to generate invitations");
      return;
    }

    setIsGeneratingLink(true);

    try {
      console.log('Creating pending invite for household:', householdId, 'with email:', email.trim() || 'null');
      
      // Create pending invite record in database
      const { data: inviteData, error: inviteError } = await supabase
        .from('pending_invites')
        .insert([{
          household_id: householdId,
          email: email.trim() || null // Store email if provided, otherwise null
        }])
        .select('id')
        .single();

      if (inviteError) {
        console.error('Error creating pending invite:', inviteError);
        throw inviteError;
      }

      console.log('Created pending invite with ID:', inviteData.id);

      // Use the generated ID as the token
      setInviteToken(inviteData.id);
      setShowEmailInput(false);

      toast.success("Invite link generated!");
    } catch (error: any) {
      console.error('Error generating invite link:', error);
      toast.error(error.message || "Failed to generate invite link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

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

      // Create invitation record in database (existing household_invitations table)
      const { data: invitationData, error: invitationError } = await supabase
        .from('household_invitations')
        .insert([{
          household_id: householdId,
          email: email.trim(),
          invited_by: user.id
        }])
        .select('token')
        .single();

      if (invitationError) throw invitationError;

      // Send invitation email
      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          householdId,
          householdName,
          inviteEmail: email.trim(),
          inviterName,
          inviteToken: invitationData.token
        }
      });

      if (error) {
        throw error;
      }

      toast.success(`Invitation sent to ${email}!`);
      
      // Close the modal after sending invitation
      handleClose();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setInviteToken("");
    setCopied(false);
    setShowEmailInput(true);
    onClose();
  };

  const handleBackToEmail = () => {
    setShowEmailInput(true);
    setInviteToken("");
    setCopied(false);
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
          {showEmailInput ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email.trim()) {
                      handleSendInvitation();
                    }
                  }}
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleClose} disabled={isLoading || isGeneratingLink}>
                  Cancel
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={generateInviteOnly} 
                  disabled={isLoading || isGeneratingLink}
                  className="flex items-center gap-2"
                >
                  <Link className="w-4 h-4" />
                  {isGeneratingLink ? "Generating..." : "Generate Link"}
                </Button>
                
                {email.trim() && (
                  <Button onClick={handleSendInvitation} disabled={isLoading || isGeneratingLink}>
                    {isLoading ? "Sending..." : "Send Invitation"}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="invite-link">Invite Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="invite-link"
                    value={generateInviteLink(inviteToken)}
                    readOnly
                    className="bg-gray-100 text-sm text-black"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => copyToClipboard(generateInviteLink(inviteToken))}
                    className="px-3"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Share this link with anyone to invite them to the household.
                </p>
              </div>

              <div className="flex gap-3 justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleBackToEmail}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Invite by Email Instead
                </Button>
                
                <Button variant="outline" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
