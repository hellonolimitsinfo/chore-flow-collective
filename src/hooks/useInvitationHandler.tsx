
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const useInvitationHandler = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleInvitation = async () => {
      // First check URL parameters
      let inviteEmail = searchParams.get('invite_email');
      let householdId = searchParams.get('household_id');
      
      // If not in URL, check localStorage
      if (!inviteEmail || !householdId) {
        const pendingInvitation = localStorage.getItem('pending_invitation');
        if (pendingInvitation) {
          const invitation = JSON.parse(pendingInvitation);
          inviteEmail = invitation.invite_email;
          householdId = invitation.household_id;
        }
      }
      
      if (!inviteEmail || !householdId) return;
      
      // If user is not logged in, redirect to auth page with invitation params preserved
      if (!user) {
        console.log('User not authenticated, redirecting to auth page');
        navigate(`/auth?invite_email=${encodeURIComponent(inviteEmail)}&household_id=${householdId}`);
        return;
      }
      
      // Check if the signed-in user's email matches the invitation email
      if (user.email !== inviteEmail) {
        toast.error('This invitation was sent to a different email address');
        // Clear the URL parameters and localStorage
        setSearchParams(new URLSearchParams());
        localStorage.removeItem('pending_invitation');
        return;
      }
      
      try {
        // Check if user is already a member
        const { data: existingMember } = await supabase
          .from('household_members')
          .select('id')
          .eq('household_id', householdId)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (existingMember) {
          toast.success('You are already a member of this household!');
          // Clear the URL parameters and localStorage
          setSearchParams(new URLSearchParams());
          localStorage.removeItem('pending_invitation');
          return;
        }
        
        // Add user to household
        const { error } = await supabase
          .from('household_members')
          .insert({
            household_id: householdId,
            user_id: user.id,
            role: 'member'
          });
          
        if (error) {
          console.error('Error adding user to household:', error);
          toast.error('Failed to join household');
          return;
        }
        
        // Get household name for success message
        const { data: household } = await supabase
          .from('households')
          .select('name')
          .eq('id', householdId)
          .single();
          
        toast.success(`Successfully joined ${household?.name || 'the household'}!`);
        
        // Clean up invitation record if it exists
        await supabase
          .from('household_invitations')
          .delete()
          .eq('email', inviteEmail)
          .eq('household_id', householdId);
          
      } catch (error) {
        console.error('Error processing invitation:', error);
        toast.error('Failed to process invitation');
      } finally {
        // Clear the URL parameters and localStorage
        setSearchParams(new URLSearchParams());
        localStorage.removeItem('pending_invitation');
      }
    };
    
    handleInvitation();
  }, [user, searchParams, setSearchParams, navigate]);
};
