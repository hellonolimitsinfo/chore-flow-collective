
import { useAuth } from "@/hooks/useAuth";
import { useHouseholds } from "@/hooks/useHouseholds";
import { useInvitationHandler } from "@/hooks/useInvitationHandler";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Users, Calendar, ShoppingCart, DollarSign } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { HouseholdCard } from "@/components/HouseholdCard";
import { CreateHouseholdForm } from "@/components/households/CreateHouseholdForm";
import { ChoresSection } from "@/components/ChoresSection";
import { ShoppingSection } from "@/components/ShoppingSection";
import { ExpensesSection } from "@/components/ExpensesSection";
import { UrgentItems } from "@/components/UrgentItems";
import { useState } from "react";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";

interface ShoppingItem {
  id: string;
  name: string;
  isLow: boolean;
  flaggedBy?: string;
  assignedTo: number;
}

const Index = () => {
  const { user, loading } = useAuth();
  const { households, loading: householdsLoading, createHousehold, renameHousehold, removeMember, deleteHousehold } = useHouseholds();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const { members } = useHouseholdMembers(selectedHouseholdId);
  
  // Handle invitation processing
  useInvitationHandler();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleCreateHousehold = async (name: string, description?: string) => {
    return await createHousehold(name, description);
  };

  const handleRenameHousehold = async (householdId: string, newName: string) => {
    return await renameHousehold(householdId, newName);
  };

  const handleRemoveMember = async (householdId: string, userId: string) => {
    return await removeMember(householdId, userId);
  };

  const handleDeleteHousehold = async (householdId: string) => {
    return await deleteHousehold(householdId);
  };

  const handleShoppingItemsChange = (items: ShoppingItem[]) => {
    setShoppingItems(items);
  };

  const handleShoppingComplete = (itemId: string) => {
    setShoppingItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const nextAssignee = (item.assignedTo + 1) % members.length;
        return {
          ...item,
          isLow: false,
          flaggedBy: undefined,
          assignedTo: nextAssignee
        };
      }
      return item;
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="p-4">
        <div className="flex justify-end mb-4">
          <UserMenu user={{ 
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || ''
          }} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            🏠 Flatmate Flow
          </h1>
          <p className="text-slate-300 text-sm mt-1">Keep track of chores, shopping, and responsibilities</p>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Households
            </h2>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </div>

          {householdsLoading ? (
            <div className="text-white">Loading households...</div>
          ) : households.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {households.map((household) => (
                <HouseholdCard 
                  key={household.id} 
                  household={household}
                  isSelected={selectedHouseholdId === household.id}
                  onSelect={() => setSelectedHouseholdId(household.id)}
                  onDelete={handleDeleteHousehold}
                  onRename={handleRenameHousehold}
                  onRemoveMember={handleRemoveMember}
                />
              ))}
            </div>
          ) : (
            <div className="text-slate-400">
              No households yet. Create one to get started!
            </div>
          )}
        </section>

        <section className="mb-8">
          <UrgentItems 
            shoppingItems={shoppingItems}
            members={members}
            onShoppingComplete={handleShoppingComplete}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div>
            <ChoresSection selectedHouseholdId={selectedHouseholdId} />
          </div>
          <div>
            <ShoppingSection 
              selectedHouseholdId={selectedHouseholdId} 
              onItemsChange={handleShoppingItemsChange}
            />
          </div>
          <div>
            <ExpensesSection />
          </div>
        </section>
      </main>

      <CreateHouseholdForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onCreateHousehold={handleCreateHousehold}
      />
    </div>
  );
};

export default Index;
