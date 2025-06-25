
import { Calendar, Plus, CheckCircle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { AddChoreDialog } from "@/components/chores/AddChoreDialog";
import { useChores } from "@/hooks/useChores";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";

interface ChoresSectionProps {
  selectedHouseholdId: string | null;
}

export const ChoresSection = ({ selectedHouseholdId }: ChoresSectionProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { chores, loading, createChore, completeChore } = useChores(selectedHouseholdId);
  const { members } = useHouseholdMembers(selectedHouseholdId);

  const handleAddChore = async (name: string, frequency: string, assigneeId: string) => {
    await createChore(name, frequency, assigneeId);
  };

  const handleCompleteChore = async (choreId: string) => {
    await completeChore(choreId);
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'text-red-400';
      case 'weekly': return 'text-blue-400';
      case 'bi-weekly': return 'text-green-400';
      case 'monthly': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center text-white">
            <Calendar className="w-5 h-5 mr-2" />
            Current Chores
          </CardTitle>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowAddDialog(true)}
            disabled={!selectedHouseholdId || members.length === 0}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Chore
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-slate-400 text-center py-4">Loading chores...</div>
          ) : !selectedHouseholdId ? (
            <div className="text-slate-400 text-center py-4">
              Select a household to view chores
            </div>
          ) : chores.length === 0 ? (
            <div className="text-slate-400 text-center py-4">
              No chores yet. Add one to get started!
            </div>
          ) : (
            chores.map((chore) => (
              <div key={chore.id} className="p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{chore.name}</h4>
                  <Button size="sm" variant="ghost" className="text-slate-400">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-slate-300 border-slate-600">
                      {chore.frequency}
                    </Badge>
                    <span className={`text-sm ${getFrequencyColor(chore.frequency)}`}>
                      {chore.assignee_name}'s turn
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleCompleteChore(chore.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Done
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AddChoreDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAddChore={handleAddChore}
        householdMembers={members}
      />
    </>
  );
};
