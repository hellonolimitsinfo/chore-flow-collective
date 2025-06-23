
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useInvitationHandler } from "@/hooks/useInvitationHandler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Users, ShoppingCart, DollarSign, ClipboardList } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Handle invitations
  useInvitationHandler();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Flatmate Flow</h1>
              <p className="text-slate-400">Welcome back, {user.email}!</p>
            </div>
          </div>
          <Button
            onClick={() => supabase.auth.signOut()}
            variant="outline"
            className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
          >
            Sign Out
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Households Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Households
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">Manage your households and invite members</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                View Households
              </Button>
            </CardContent>
          </Card>

          {/* Chores Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Chores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">Track and assign household chores</p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                View Chores
              </Button>
            </CardContent>
          </Card>

          {/* Shopping Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Shopping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">Shared shopping lists for your household</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                View Lists
              </Button>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">Track shared expenses and split bills</p>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                View Expenses
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
