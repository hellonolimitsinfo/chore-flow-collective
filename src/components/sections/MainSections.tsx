
import { ChoresSection } from "@/components/ChoresSection";
import { ShoppingSection } from "@/components/ShoppingSection";
import { ExpensesSection } from "@/components/ExpensesSection";

interface MainSectionsProps {
  selectedHouseholdId: string | null;
  onShoppingItemUpdated: () => void;
}

export const MainSections = ({ selectedHouseholdId, onShoppingItemUpdated }: MainSectionsProps) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      <div>
        <ChoresSection selectedHouseholdId={selectedHouseholdId} />
      </div>
      <div>
        <ShoppingSection selectedHouseholdId={selectedHouseholdId} onItemUpdated={onShoppingItemUpdated} />
      </div>
      <div>
        <ExpensesSection selectedHouseholdId={selectedHouseholdId} />
      </div>
    </section>
  );
};
