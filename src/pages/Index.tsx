
import { useAuth } from "@/hooks/useAuth";
import { useHouseholds } from "@/hooks/useHouseholds";
import { useInvitationHandler } from "@/hooks/useInvitationHandler";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { HouseholdCard } from "@/components/HouseholdCard";
import { CreateHouseholdForm } from "@/components/households/CreateHouseholdForm";
import { ChoresSection } from "@/components/ChoresSection";
import { ShoppingSection } from "@/components/ShoppingSection";
import { ExpensesSection } from "@/components/ExpensesSection";
import { HistorySection } from "@/components/HistorySection";
import { UrgentItemsSection } from "@/components/shopping/UrgentItemsSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShoppingItems } from "@/hooks/useShoppingItems";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { households, loading: householdsLoading, createHousehold, renameHousehold, removeMember, deleteHousehold, refetch: refetchHouseholds } = useHouseholds();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  
  // Handle invitation processing with household refetch
  useInvitationHandler({ refetchHouseholds });

  // Get shopping items and members for urgent section
  const { shoppingItems, updateShoppingItem, refreshItems } = useShoppingItems(selectedHouseholdId);
  const { members } = useHouseholdMembers(selectedHouseholdId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">{t('loading')}</div>
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

  // Log shopping actions to the shopping_logs table
  const logShoppingAction = async (action: string, itemName: string, memberName: string) => {
    if (!selectedHouseholdId) return;
    
    try {
      const { error } = await supabase
        .from('shopping_logs')
        .insert({
          household_id: selectedHouseholdId,
          action,
          item_name: itemName,
          member_name: memberName
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging shopping action:', error);
    }
  };

  // Handle urgent items "Bought" button - should work exactly like shopping items "Bought"
  const handleUrgentItemBought = async (itemId: string) => {
    const currentUserName = user?.user_metadata?.full_name || user?.email || 'Someone';
    const item = shoppingItems.find(i => i.id === itemId);
    
    if (!item || !members.length) return;
    
    try {
      // Get current assigned member index
      let currentMemberIndex = 0;
      if (typeof item.assigned_member_index === 'number') {
        currentMemberIndex = item.assigned_member_index;
      } else {
        // Calculate based on creation order if not set
        const sortedItems = [...shoppingItems].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const itemIndex = sortedItems.findIndex(sortedItem => sortedItem.id === itemId);
        currentMemberIndex = itemIndex % members.length;
      }
      
      // Get current assigned member name for logging
      const currentMember = members[currentMemberIndex];
      const assignedMemberName = currentMember?.full_name || currentMember?.email || 'Unknown';
      
      // Calculate next member index
      const nextMemberIndex = (currentMemberIndex + 1) % members.length;
      
      // Log the shopping action with the assigned member who was supposed to buy it
      await logShoppingAction('purchased', item.name, assignedMemberName);
      
      // Reset item to default state (remove low stock, clear purchased_by, assign to next person)
      await updateShoppingItem(itemId, { 
        is_purchased: false,
        purchased_by: null, // This removes the "Low Stock" status
        assigned_member_index: nextMemberIndex
      });

      // Force refresh the shopping items to ensure both sections are updated immediately
      await refreshItems();
      
      const nextMember = members[nextMemberIndex];
      const nextMemberName = nextMember?.full_name || nextMember?.email || 'next person';
      
      toast({
        title: "Item purchased! ✅",
        description: `${item.name} bought by ${assignedMemberName}. Now assigned to ${nextMemberName}.`,
      });
    } catch (error) {
      console.error('Error handling urgent item bought:', error);
      toast({
        title: "Error",
        description: "Failed to update shopping item",
        variant: "destructive",
      });
    }
  };

  // Get flagged items (items that have purchased_by set but are not purchased)
  const flaggedItems = shoppingItems.filter(item => !item.is_purchased && item.purchased_by);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="p-4">
        <div className="flex justify-end items-center mb-4">
          <UserMenu user={{ 
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || ''
          }} />
        </div>
        <div className="text-center">
          <h1 className="text-5xl font-bold flex items-center justify-center gap-2 mb-2">
            🏠 {t('flatmate_flow')}
          </h1>
          <p className="text-slate-300 text-xl">{t('tagline')}</p>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('your_households')}
            </h2>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('create_new')}
            </Button>
          </div>

          {householdsLoading ? (
            <div className="text-white">{t('loading')}</div>
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
              {t('no_households')}
            </div>
          )}
        </section>

        {/* Urgent Items Section - Separate Row */}
        {flaggedItems.length > 0 && (
          <section className="mb-8">
            <UrgentItemsSection 
              flaggedItems={flaggedItems}
              members={members}
              onMarkPurchased={handleUrgentItemBought}
            />
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div>
            <ChoresSection selectedHouseholdId={selectedHouseholdId} />
          </div>
          <div>
            <ShoppingSection selectedHouseholdId={selectedHouseholdId} onItemUpdated={refreshItems} />
          </div>
          <div>
            <ExpensesSection selectedHouseholdId={selectedHouseholdId} />
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
