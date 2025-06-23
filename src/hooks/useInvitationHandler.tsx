
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
          try {
            const invitation = JSON.parse(pendingInvitation);
            inviteEmail = invitation.invite_email;
            householdId = invitation.household_id;
            console.log('Retrieved invitation from localStorage:', { inviteEmail, householdId });
          } catch (error) {
            console.error('Error parsing stored invitation:', error);
            localStorage.removeItem('pending_invitation');
            return;
          }
        }
      }
      
      if (!inviteEmail || !householdId) {
        console.log('No invitation parameters found');
        return;
      }
      
      console.log('Processing invitation:', { inviteEmail, householdId, userEmail: user?.email });
      
      // If user is not logged in, redirect to auth page with invitation params preserved
      if (!user) {
        console.log('User not authenticated, redirecting to auth page');
        navigate(`/auth?invite_email=${encodeURIComponent(inviteEmail)}&household_id=${householdId}`);
        return;
      }
      
      // Check if the signed-in user's email matches the invitation email
      if (user.email !== inviteEmail) {
        console.error('Email mismatch:', { userEmail: user.email, inviteEmail });
        toast.error(`This invitation was sent to ${inviteEmail}. Please sign in with that email address.`);
        // Clear the URL parameters and localStorage
        setSearchParams(new URLSearchParams());
        localStorage.removeItem('pending_invitation');
        return;
      }
      
      try {
        console.log('Checking existing membership for user:', user.id, 'household:', householdId);
        
        // Check if user is already a member
        const { data: existingMember, error: memberError } = await supabase
          .from('household_members')
          .select('id')
          .eq('household_id', householdId)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (memberError) {
          console.error('Error checking membership:', memberError);
          toast.error('Failed to check household membership');
          return;
        }
          
        if (existingMember) {
          console.log('User is already a member');
          toast.success('You are already a member of this household!');
          // Clear the URL parameters and localStorage
          setSearchParams(new URLSearchParams());
          localStorage.removeItem('pending_invitation');
          return;
        }
        
        console.log('Adding user to household');
        
        // Add user to household
        const { error: insertError } = await supabase
          .from('household_members')
          .insert({
            household_id: householdId,
            user_id: user.id,
            role: 'member'
          });
          
        if (insertError) {
          console.error('Error adding user to household:', insertError);
          toast.error('Failed to join household');
          return;
        }
        
        console.log('User successfully added to household');
        
        // Get household name for success message
        const { data: household, error: householdError } = await supabase
          .from('households')
          .select('name')
          .eq('id', householdId)
          .single();
          
        if (householdError) {
          console.error('Error fetching household:', householdError);
        }
          
        toast.success(`Successfully joined ${household?.name || 'the household'}!`);
        
        // Clean up invitation record if it exists
        const { error: deleteError } = await supabase
          .from('household_invitations')
          .delete()
          .eq('email', inviteEmail)
          .eq('household_id', householdId);
          
        if (deleteError) {
          console.error('Error cleaning up invitation:', deleteError);
          // Don't show error to user as this is cleanup
        }
          
      } catch (error) {
        console.error('Error processing invitation:', error);
        toast.error('Failed to process invitation');
      } finally {
        // Clear the URL parameters and localStorage
        console.log('Cleaning up invitation parameters');
        setSearchParams(new URLSearchParams());
        localStorage.removeItem('pending_invitation');
      }
    };
    
    // Only run if we have a user or invitation parameters
    if (user || searchParams.get('invite_email') || localStorage.getItem('pending_invitation')) {
      handleInvitation();
    }
  }, [user, searchParams, setSearchParams, navigate]);
};
