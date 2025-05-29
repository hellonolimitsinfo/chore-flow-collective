
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Home } from "lucide-react";
import { HouseholdCard } from "@/components/HouseholdCard";
import { UrgentItems } from "@/components/UrgentItems";
import { ChoresSection } from "@/components/ChoresSection";
import { ShoppingSection } from "@/components/ShoppingSection";
import { ExpensesSection } from "@/components/ExpensesSection";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [households] = useState([
    { id: 1, name: "Main House", memberCount: 3 }
  ]);
  const [selectedHousehold, setSelectedHousehold] = useState(households[0]);
  const [showCreateHousehold, setShowCreateHousehold] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      // Fetch user profile
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUserProfile(data);
        }
      };
      fetchProfile();
    }
  }, [user, loading, navigate]);

  const handleCreateHousehold = () => {
    if (newHouseholdName.trim()) {
      console.log("Creating household:", newHouseholdName);
      setNewHouseholdName("");
      setShowCreateHousehold(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // This will redirect to auth in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flatmate-gradient flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Flatmate Flow</h1>
                <p className="text-slate-400 text-sm">Keep track of chores, shopping, and responsibilities</p>
              </div>
            </div>
            <UserMenu user={{ 
              name: userProfile?.full_name || user.email?.split('@')[0] || 'User',
              email: user.email || '' 
            }} />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Household Creation */}
        {!selectedHousehold && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Create Your Household</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showCreateHousehold ? (
                <Button 
                  onClick={() => setShowCreateHousehold(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Household
                </Button>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="Enter household name"
                    value={newHouseholdName}
                    onChange={(e) => setNewHouseholdName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleCreateHousehold}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Create Household
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateHousehold(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Household Selection */}
        {households.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Your Households</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {households.map((household) => (
                <HouseholdCard
                  key={household.id}
                  household={household}
                  isSelected={selectedHousehold?.id === household.id}
                  onSelect={() => setSelectedHousehold(household)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Dashboard */}
        {selectedHousehold && (
          <>
            {/* Urgent Items */}
            <UrgentItems />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              <ChoresSection />
              <ShoppingSection />
              <ExpensesSection />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
