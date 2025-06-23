
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthHeader from "@/components/auth/AuthHeader";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { AuthForm } from "@/components/auth/AuthForm";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Store invitation parameters in localStorage if they exist
    const inviteEmail = searchParams.get('invite_email');
    const householdId = searchParams.get('household_id');
    
    if (inviteEmail && householdId) {
      localStorage.setItem('pending_invitation', JSON.stringify({
        invite_email: inviteEmail,
        household_id: householdId
      }));
      console.log('Stored invitation parameters:', { inviteEmail, householdId });
    }

    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If user is already logged in, redirect to home page
        // The useInvitationHandler will handle the invitation processing
        navigate("/");
      }
    };
    checkUser();
  }, [navigate, searchParams]);

  const resetForm = () => {
    // This function is no longer needed as form state is managed in AuthForm
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthHeader isLogin={isLogin} />

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">
              {isLogin ? "Sign In" : "Sign Up"}
            </CardTitle>
            {searchParams.get('invite_email') && (
              <p className="text-sm text-slate-400 text-center mt-2">
                You've been invited to join a household. Please {isLogin ? 'sign in' : 'sign up'} to continue.
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
