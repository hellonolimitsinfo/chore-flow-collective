
import { Calendar, Plus, CheckCircle, MoreHorizontal, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { AddChoreDialog } from "@/components/chores/AddChoreDialog";
import { useChores } from "@/hooks/useChores";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChoresSectionProps {
  selectedHouseholdId: string | null;
}

export const ChoresSection = ({ selectedHouseholdId }: ChoresSectionProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAddingExamples, setIsAddingExamples] = useState(false);
  const { chores, loading, createChore, completeChore, deleteChore } = useChores(selectedHouseholdId);
  const { members, loading: membersLoading } = useHouseholdMembers(selectedHouseholdId);

  const handleAddChore = async (name: string, frequency: string, assigneeId: string) => {
    await createChore(name, frequency, assigneeId);
  };

  const handleCompleteChore = async (choreId: string) => {
    await completeChore(choreId);
  };

  const handleDeleteChore = async (choreId: string) => {
    await deleteChore(choreId);
  };

  const handleAddExamples = async () => {
    if (!selectedHouseholdId || members.length === 0 || isAddingExamples) return;

    setIsAddingExamples(true);
    
    const exampleChores = [
      { name: "Take out bins", frequency: "weekly" },
      { name: "Clean bathroom", frequency: "bi-weekly" },
      { name: "Vacuum living room", frequency: "weekly" },
      { name: "Clean kitchen", frequency: "weekly" }
    ];

    try {
      // Distribute chores among household members
      for (let i = 0; i < exampleChores.length; i++) {
        const assignee = members[i % members.length];
        await createChore(
          exampleChores[i].name,
          exampleChores[i].frequency,
          assignee.user_id
        );
      }
    } catch (error) {
      console.error('Error adding example chores:', error);
    } finally {
      setIsAddingExamples(false);
    }
  };

  const getAssigneeColor = (assigneeName: string) => {
    // Generate consistent colors based on name
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    const index = assigneeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const isAddButtonDisabled = !selectedHouseholdId || membersLoading || members.length === 0;
  const showExamplesButton = selectedHouseholdId && members.length > 0 && chores.length === 0 && !loading;

  return (
    <>
      <Card className="bg-gray-800/80 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-gray-100 text-lg">
            <Calendar className="h-5 w-5" />
            Current Chores
          </CardTitle>
          <Button 
            size="sm" 
            className="h-8 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-600 disabled:cursor-not-allowed"
            onClick={() => setShowAddDialog(true)}
            disabled={isAddButtonDisabled}
            title={
              !selectedHouseholdId 
                ? "Select a household first" 
                : members.length === 0 
                  ? "No household members found" 
                  : "Add a new chore"
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Add Chore</span>
          </Button>
        </CardHeader>
        
        {showExamplesButton && (
          <div className="px-6 pb-2">
            <Button 
              size="sm" 
              variant="outline"
              className="h-8 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
              onClick={handleAddExamples}
              disabled={isAddingExamples}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {isAddingExamples ? "Adding..." : "Add Examples"}
            </Button>
          </div>
        )}

        <CardContent>
          {loading ? (
            <div className="text-gray-400 text-center py-4">Loading chores...</div>
          ) : !selectedHouseholdId ? (
            <div className="text-gray-400 text-center py-4">
              Select a household to view chores
            </div>
          ) : chores.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              No chores yet. Add one to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {chores.map((chore) => (
                <div key={chore.id} className="p-4 border rounded-lg border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-3 h-3 rounded-full ${getAssigneeColor(chore.assignee_name || '')}`}></div>
                      <div>
                        <h3 className="font-medium text-gray-200">{chore.name}</h3>
                        <span className="text-sm text-gray-300">
                          {chore.assignee_name}'s turn
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                        {chore.frequency}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem 
                            onClick={() => handleDeleteChore(chore.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      size="sm" 
                      onClick={() => handleCompleteChore(chore.id)}
                      className="bg-green-700 hover:bg-green-800"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Done
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
