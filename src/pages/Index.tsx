
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Home } from "lucide-react";
import { HouseholdCard } from "@/components/HouseholdCard";
import { UrgentItems } from "@/components/UrgentItems";
import { ChoresSection } from "@/components/ChoresSection";
import { ShoppingSection } from "@/components/ShoppingSection";
import { ExpensesSection } from "@/components/ExpensesSection";
import { UserMenu } from "@/components/UserMenu";
import { CreateHouseholdForm } from "@/components/households/CreateHouseholdForm";
import { useAuth } from "@/hooks/useAuth";
import { useHouseholds } from "@/hooks/useHouseholds";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { households, loading: householdsLoading, createHousehold, deleteHousehold } = useHouseholds();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedHousehold, setSelectedHousehold] = useState<any>(null);
  const [showCreateHousehold, setShowCreateHousehold] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Auto-select first household if none selected
    if (households.length > 0 && !selectedHousehold) {
      setSelectedHousehold(households[0]);
    }
  }, [households, selectedHousehold]);

  const handleCreateHousehold = async (name: string, description?: string) => {
    const result = await createHousehold(name, description);
    if (result) {
      setShowCreateHousehold(false);
      setSelectedHousehold(result);
    }
    return result;
  };

  const handleDeleteHousehold = async (householdId: string) => {
    const success = await deleteHousehold(householdId);
    if (success && selectedHousehold?.id === householdId) {
      setSelectedHousehold(null);
    }
  };

  if (authLoading || householdsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // This will redirect to auth in useEffect
  }

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#f5f5f5]' : 'bg-gradient-to-br from-background to-muted'} text-foreground`}>
      {/* Header */}
      <header className={`border-b ${theme === 'light' ? 'border-[#ddd] bg-white shadow-sm' : 'border-border bg-card/50 backdrop-blur-sm'}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flatmate-gradient flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${theme === 'light' ? 'text-[#111111]' : 'text-foreground'}`}>Flatmate Flow</h1>
                <p className={`text-sm ${theme === 'light' ? 'text-[#666666]' : 'text-muted-foreground'}`}>Keep track of chores, shopping, and responsibilities</p>
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
        {/* Household Creation Form */}
        {showCreateHousehold && (
          <CreateHouseholdForm 
            onCreateHousehold={handleCreateHousehold}
            onCancel={() => setShowCreateHousehold(false)}
          />
        )}

        {/* Household Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-[#111111]' : 'text-foreground'}`}>Your Households</h2>
            {!showCreateHousehold && (
              <Button 
                onClick={() => setShowCreateHousehold(true)}
                className={theme === 'light' 
                  ? 'bg-[#007BFF] hover:bg-[#0056b3] text-white shadow-sm' 
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Household
              </Button>
            )}
          </div>

          {households.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {households.map((household) => (
                <HouseholdCard
                  key={household.id}
                  household={household}
                  isSelected={selectedHousehold?.id === household.id}
                  onSelect={() => setSelectedHousehold(household)}
                  onDelete={handleDeleteHousehold}
                />
              ))}
            </div>
          ) : (
            !showCreateHousehold && (
              <div className="text-center py-8">
                <p className={`mb-4 ${theme === 'light' ? 'text-[#666666]' : 'text-muted-foreground'}`}>You haven't joined any households yet.</p>
                <Button 
                  onClick={() => setShowCreateHousehold(true)}
                  className={theme === 'light' 
                    ? 'bg-[#007BFF] hover:bg-[#0056b3] text-white shadow-sm' 
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Household
                </Button>
              </div>
            )
          )}
        </div>

        {/* Main Dashboard */}
        {selectedHousehold && (
          <>
            <div className={`border-t pt-6 ${theme === 'light' ? 'border-[#ddd]' : 'border-border'}`}>
              <h3 className={`text-lg font-medium mb-4 ${theme === 'light' ? 'text-[#111111]' : 'text-foreground'}`}>
                Managing: {selectedHousehold.name}
              </h3>
            </div>

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
