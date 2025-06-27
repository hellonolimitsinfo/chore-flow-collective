
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { HouseholdCard } from "@/components/HouseholdCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface Household {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  members: Array<{ full_name: string | null; email: string; role: string }>;
}

interface HouseholdSectionProps {
  households: Household[];
  householdsLoading: boolean;
  selectedHouseholdId: string | null;
  onHouseholdSelect: (id: string) => void;
  onShowCreateForm: () => void;
  onDeleteHousehold: (householdId: string) => Promise<boolean>;
  onRenameHousehold: (householdId: string, newName: string) => Promise<boolean>;
  onRemoveMember: (householdId: string, userId: string) => Promise<boolean>;
}

export const HouseholdSection = ({
  households,
  householdsLoading,
  selectedHouseholdId,
  onHouseholdSelect,
  onShowCreateForm,
  onDeleteHousehold,
  onRenameHousehold,
  onRemoveMember
}: HouseholdSectionProps) => {
  const { t } = useLanguage();

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t('your_households')}
        </h2>
        <Button onClick={onShowCreateForm}>
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
              onSelect={() => onHouseholdSelect(household.id)}
              onDelete={onDeleteHousehold}
              onRename={onRenameHousehold}
              onRemoveMember={onRemoveMember}
            />
          ))}
        </div>
      ) : (
        <div className="text-slate-400">
          {t('no_households')}
        </div>
      )}
    </section>
  );
};
