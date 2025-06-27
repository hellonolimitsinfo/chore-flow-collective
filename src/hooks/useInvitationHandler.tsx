
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const useInvitationHandler = () => {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleInvitation = async () => {
      if (loading) return; // wait until auth is done loading
      
      // Check for token-based invitations first (from either /auth or /join routes)
      let token = searchParams.get('token');
      
      // Also check localStorage for token from auth redirect
      if (!token) {
        const storedToken = localStorage.getItem('pending_invite_token');
        if (storedToken) {
          token = storedToken;
          localStorage.removeItem('pending_invite_token');
          console.log('Retrieved token from localStorage:', token);
        }
      }
      
      // Then check URL parameters for email-based invitations
      let inviteEmail = searchParams.get('invite_email');
      let householdId = searchParams.get('household_id');
      
      // If not in URL, check localStorage for email-based invitations
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
          }
        }
      }

      // Handle token-based invitations
      if (token) {
        console.log('Processing token-based invitation:', { token });
        
        // If user is not logged in, store token and redirect to auth page
        if (!user) {
          console.log('User not authenticated, storing token and redirecting to auth page');
          localStorage.setItem('pending_invite_token', token);
          navigate(`/auth?token=${token}`);
          return;
        }

        try {
          console.log('User authenticated, processing token invitation for user:', user.email);
          
          // Look up the pending invite
          const { data: pendingInvite, error: inviteError } = await supabase
            .from('pending_invites')
            .select('household_id, email, expires_at')
            .eq('id', token)
            .maybeSingle();

          if (inviteError) {
            console.error('Error fetching pending invite:', inviteError);
            toast.error('Invalid or expired invitation link');
            setSearchParams(new URLSearchParams());
            return;
          }

          if (!pendingInvite) {
            console.error('Pending invite not found for token:', token);
            toast.error('Invalid or expired invitation link');
            setSearchParams(new URLSearchParams());
            return;
          }

          console.log('Found pending invite:', pendingInvite);

          // Check if invite has expired
          if (new Date(pendingInvite.expires_at) < new Date()) {
            console.error('Invite has expired');
            toast.error('This invitation has expired');
            setSearchParams(new URLSearchParams());
            return;
          }

          // If invite has an email, check if user's email matches
          if (pendingInvite.email && user.email !== pendingInvite.email) {
            console.error('Email mismatch:', { userEmail: user.email, inviteEmail: pendingInvite.email });
            toast.error(`This invitation was sent to ${pendingInvite.email}. Please sign in with that email address.`);
            setSearchParams(new URLSearchParams());
            return;
          }

          // Check if user is already a member
          const { data: existingMember, error: memberError } = await supabase
            .from('household_members')
            .select('id')
            .eq('household_id', pendingInvite.household_id)
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
            setSearchParams(new URLSearchParams());
            
            // Clean up the used invite
            await supabase
              .from('pending_invites')
              .delete()
              .eq('id', token);
            
            // Navigate to home
            navigate('/');
            return;
          }

          console.log('Adding user to household:', { userId: user.id, householdId: pendingInvite.household_id });

          // Add user to household
          const { error: insertError } = await supabase
            .from('household_members')
            .insert({
              household_id: pendingInvite.household_id,
              user_id: user.id,
              role: 'member'
            });
            
          if (insertError) {
            console.error('Error adding user to household:', insertError);
            toast.error('Failed to join household');
            return;
          }

          console.log('Successfully added user to household');

          // Get household name for success message
          const { data: household, error: householdError } = await supabase
            .from('households')
            .select('name')
            .eq('id', pendingInvite.household_id)
            .single();
            
          if (householdError) {
            console.error('Error fetching household:', householdError);
          }
            
          toast.success(`You've joined ${household?.name || 'the household'}!`);

          // Clean up the used invite
          await supabase
            .from('pending_invites')
            .delete()
            .eq('id', token);

          setSearchParams(new URLSearchParams());
          
          // Navigate to home after successful join
          navigate('/');
          return;

        } catch (error) {
          console.error('Error processing token-based invitation:', error);
          toast.error('Failed to process invitation');
          setSearchParams(new URLSearchParams());
          return;
        }
      }

      // Handle email-based invitations (existing logic)
      if (!inviteEmail || !householdId) {
        console.log('No invitation parameters found');
        return;
      }
      
      console.log('Processing email-based invitation:', { inviteEmail, householdId, userEmail: user?.email });
      
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
    
    // Run the handler when we have necessary conditions
    handleInvitation();
  }, [user, searchParams, setSearchParams, navigate, loading]);
};
