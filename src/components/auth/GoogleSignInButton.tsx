
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoogleSignInButtonProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const GoogleSignInButton = ({ loading, setLoading }: GoogleSignInButtonProps) => {
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      
      // Get invitation parameters from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const inviteEmail = urlParams.get('invite_email');
      const householdId = urlParams.get('household_id');
      
      // If not in URL, check localStorage
      let pendingInvitation = null;
      if (!inviteEmail || !householdId) {
        const storedInvitation = localStorage.getItem('pending_invitation');
        if (storedInvitation) {
          pendingInvitation = JSON.parse(storedInvitation);
        }
      } else {
        pendingInvitation = { invite_email: inviteEmail, household_id: householdId };
        // Store in localStorage as backup
        localStorage.setItem('pending_invitation', JSON.stringify(pendingInvitation));
      }
      
      // Create redirect URL with invitation parameters
      let redirectUrl = 'https://chore-flow-collective.lovable.app';
      
      if (pendingInvitation) {
        // Include invitation parameters in the redirect URL so they survive OAuth
        redirectUrl = `https://chore-flow-collective.lovable.app/?invite_email=${encodeURIComponent(pendingInvitation.invite_email)}&household_id=${pendingInvitation.household_id}`;
      }
      
      console.log('Google OAuth redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        toast.error(error.message);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error("An unexpected error occurred with Google sign-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleGoogleSignIn}
        variant="outline"
        className="w-full mb-4 bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
        disabled={loading}
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </Button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-600" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-800 px-2 text-slate-400">Or continue with email</span>
        </div>
      </div>
    </>
  );
};

export default GoogleSignInButton;
