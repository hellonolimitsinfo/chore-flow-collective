
import { useAuth } from "@/hooks/useAuth";
import { useHouseholds } from "@/hooks/useHouseholds";
import { useInvitationHandler } from "@/hooks/useInvitationHandler";
import { Navigate } from "react-router-dom";
import { UserMenu } from "@/components/UserMenu";
import { CreateHouseholdForm } from "@/components/households/CreateHouseholdForm";
import { HistorySection } from "@/components/HistorySection";
import { UrgentItemsSection } from "@/components/shopping/UrgentItemsSection";
import { HouseholdSection } from "@/components/sections/HouseholdSection";
import { MainSections } from "@/components/sections/MainSections";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShoppingItems } from "@/hooks/useShoppingItems";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import { useShoppingActions } from "@/hooks/useShoppingActions";
import { useState } from "react";

const Index = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { households, loading: householdsLoading, createHousehold, renameHousehold, removeMember, deleteHousehold } = useHouseholds();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  
  // Handle invitation processing
  useInvitationHandler();

  // Get shopping items and members for urgent section
  const { shoppingItems, updateShoppingItem, refreshItems } = useShoppingItems(selectedHouseholdId);
  const { members } = useHouseholdMembers(selectedHouseholdId);
  const { handleUrgentItemBought } = useShoppingActions(selectedHouseholdId);

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

  const handleUrgentItemBoughtWrapper = (itemId: string) => {
    handleUrgentItemBought(itemId, shoppingItems, members, user, updateShoppingItem, refreshItems);
  };

  // Get flagged items (items that have purchased_by set but are not purchased)
  const flaggedItems = shoppingItems.filter(item => !item.is_purchased && item.purchased_by);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
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
        <HouseholdSection
          households={households}
          householdsLoading={householdsLoading}
          selectedHouseholdId={selectedHouseholdId}
          onHouseholdSelect={setSelectedHouseholdId}
          onShowCreateForm={() => setShowCreateForm(true)}
          onDeleteHousehold={handleDeleteHousehold}
          onRenameHousehold={handleRenameHousehold}
          onRemoveMember={handleRemoveMember}
        />

        {/* Urgent Items Section - Separate Row */}
        {flaggedItems.length > 0 && (
          <section className="mb-8">
            <UrgentItemsSection 
              flaggedItems={flaggedItems}
              members={members}
              onMarkPurchased={handleUrgentItemBoughtWrapper}
            />
          </section>
        )}

        <MainSections 
          selectedHouseholdId={selectedHouseholdId}
          onShoppingItemUpdated={refreshItems}
        />

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
