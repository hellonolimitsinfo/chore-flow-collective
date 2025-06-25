
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
import { HistorySection } from "@/components/HistorySection";
import { UrgentItemsSection } from "@/components/shopping/UrgentItemsSection";
import { useShoppingItems } from "@/hooks/useShoppingItems";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import { useState } from "react";

const Index = () => {
  const { user, loading } = useAuth();
  const { households, loading: householdsLoading, createHousehold, renameHousehold, removeMember, deleteHousehold } = useHouseholds();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  
  // Handle invitation processing
  useInvitationHandler();

  // Get shopping items and members for urgent section
  const { shoppingItems, updateShoppingItem } = useShoppingItems(selectedHouseholdId);
  const { members } = useHouseholdMembers(selectedHouseholdId);

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

  const getNextMember = (currentMemberName: string) => {
    if (members.length === 0) return null;
    
    // Find current member index
    const currentIndex = members.findIndex(member => 
      (member.full_name || member.email) === currentMemberName
    );
    
    // Get next member (rotate to beginning if at end)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % members.length;
    const nextMember = members[nextIndex];
    
    return nextMember.full_name || nextMember.email;
  };

  // Handle urgent items "Bought" button - mark as purchased and rotate to next person
  const handleUrgentItemBought = async (itemId: string) => {
    const currentUserName = user?.user_metadata?.full_name || user?.email || 'Someone';
    const item = shoppingItems.find(i => i.id === itemId);
    
    if (!item) return;
    
    try {
      const nextMember = getNextMember(item.purchased_by || '');
      
      // Mark as purchased
      await updateShoppingItem(itemId, { 
        is_purchased: true,
        purchased_by: currentUserName
      });
      
      // Add new item for next person if there are members
      if (nextMember && selectedHouseholdId) {
        const { addShoppingItem } = require('@/hooks/useShoppingItems');
        // This is a workaround - ideally we'd have access to addShoppingItem here
        // For now, we'll just reset the current item for the next person
        setTimeout(async () => {
          await updateShoppingItem(itemId, {
            is_purchased: false,
            purchased_by: nextMember
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Error handling urgent item bought:', error);
    }
  };

  // Get flagged items (items that have purchased_by set but are not purchased)
  const flaggedItems = shoppingItems.filter(item => !item.is_purchased && item.purchased_by);

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
          <h1 className="text-5xl font-bold flex items-center justify-center gap-2 mb-2">
            🏠 Flatmate Flow
          </h1>
          <p className="text-slate-300 text-xl">Keep track of chores, shopping, and responsibilities</p>
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

        {/* Urgent Items Section - Separate Row */}
        {flaggedItems.length > 0 && (
          <section className="mb-8">
            <UrgentItemsSection 
              flaggedItems={flaggedItems}
              onMarkPurchased={handleUrgentItemBought}
            />
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div>
            <ChoresSection selectedHouseholdId={selectedHouseholdId} />
          </div>
          <div>
            <ShoppingSection selectedHouseholdId={selectedHouseholdId} />
          </div>
          <div>
            <ExpensesSection />
          </div>
        </section>

        <section className="mb-8">
          <HistorySection selectedHouseholdId={selectedHouseholdId} />
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
