
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthFormProps {
  isLogin: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const AuthForm = ({ isLogin, loading, setLoading }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please check your credentials.");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Please check your email and click the confirmation link before signing in.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Successfully signed in!");
        
        // Handle invitation redirect with URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const inviteEmail = urlParams.get('invite_email');
        const householdId = urlParams.get('household_id');
        
        if (inviteEmail && householdId) {
          navigate(`/?invite_email=${encodeURIComponent(inviteEmail)}&household_id=${householdId}`);
        } else {
          // Check localStorage as fallback
          const pendingInvitation = localStorage.getItem('pending_invitation');
          if (pendingInvitation) {
            const invitation = JSON.parse(pendingInvitation);
            navigate(`/?invite_email=${encodeURIComponent(invitation.invite_email)}&household_id=${invitation.household_id}`);
          } else {
            navigate("/");
          }
        }
      } else {
        // Get invitation parameters for redirect URL
        const urlParams = new URLSearchParams(window.location.search);
        const inviteEmail = urlParams.get('invite_email');
        const householdId = urlParams.get('household_id');
        
        // Check if this is the invited email
        if (inviteEmail && email !== inviteEmail) {
          toast.error(`This invitation was sent to ${inviteEmail}. Please use that email address to sign up.`);
          return;
        }
        
        let redirectUrl = `${window.location.origin}/`;
        
        if (inviteEmail && householdId) {
          redirectUrl = `${window.location.origin}/?invite_email=${encodeURIComponent(inviteEmail)}&household_id=${householdId}`;
          // Store in localStorage as backup
          localStorage.setItem('pending_invitation', JSON.stringify({
            invite_email: inviteEmail,
            household_id: householdId
          }));
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: redirectUrl
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("An account with this email already exists. Please sign in instead.");
          } else if (error.message.includes("Password should be")) {
            toast.error("Password should be at least 6 characters long.");
          } else {
            console.error('Sign up error:', error);
            toast.error(error.message);
          }
          return;
        }

        toast.success("Account created! Please check your email for verification.");
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAuth} className="space-y-4">
      {!isLogin && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              required={!isLogin}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
      </Button>
    </form>
  );
};

export { AuthForm };
