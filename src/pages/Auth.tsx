
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import AuthHeader from "@/components/auth/AuthHeader";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { AuthForm } from "@/components/auth/AuthForm";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    // Store invitation parameters in localStorage if they exist
    const inviteEmail = searchParams.get('invite_email');
    const householdId = searchParams.get('household_id');
    const token = searchParams.get('token');
    
    if (inviteEmail && householdId) {
      localStorage.setItem('pending_invitation', JSON.stringify({
        invite_email: inviteEmail,
        household_id: householdId
      }));
      console.log('Stored invitation parameters:', { inviteEmail, householdId });
    }

    // Store token for processing after authentication
    if (token) {
      localStorage.setItem('pending_invite_token', token);
      console.log('Stored invite token:', token);
    }

    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('User already logged in, redirecting with invitation params');
        // If user is already logged in, redirect with invitation parameters preserved
        if (token) {
          navigate(`/?token=${token}`);
        } else if (inviteEmail && householdId) {
          navigate(`/?invite_email=${encodeURIComponent(inviteEmail)}&household_id=${householdId}`);
        } else {
          navigate("/");
        }
      }
    };
    checkUser();
  }, [navigate, searchParams]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  // Get invitation info for display
  const inviteEmail = searchParams.get('invite_email');
  const token = searchParams.get('token');
  const isInviteFlow = !!(inviteEmail || token);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthHeader isLogin={isLogin} />

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">
              {isLogin ? "Sign In" : "Sign Up"}
            </CardTitle>
            {isInviteFlow && (
              <p className="text-sm text-slate-400 text-center mt-2">
                You've been invited to join a household. Please {isLogin ? 'sign in' : 'sign up'} 
                {inviteEmail && <span className="text-blue-400"> with {inviteEmail}</span>} to continue.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <GoogleSignInButton loading={loading} setLoading={setLoading} />
            
            <AuthForm 
              isLogin={isLogin} 
              loading={loading} 
              setLoading={setLoading} 
            />

            <div className="mt-6 text-center">
              <p className="text-slate-400">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <Button
                variant="link"
                onClick={toggleMode}
                className="text-blue-400 hover:text-blue-300 p-0 h-auto"
              >
                {isLogin ? "Sign up here" : "Sign in here"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
