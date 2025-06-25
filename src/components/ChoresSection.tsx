
import { Calendar, Plus, CheckCircle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { AddChoreDialog } from "@/components/chores/AddChoreDialog";
import { useChores } from "@/hooks/useChores";
import { useHouseholdMembers } from "@/hooks/useHouseholdMembers";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface ChoresSectionProps {
  selectedHouseholdId: string | null;
}

export const ChoresSection = ({ selectedHouseholdId }: ChoresSectionProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
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

  const getAssigneeColor = (assigneeName: string) => {
    // Generate consistent colors based on name
    const colors = [
      'bg-purple-500',
      'bg-green-500', 
      'bg-blue-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    const index = assigneeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const isAddButtonDisabled = !selectedHouseholdId || membersLoading || members.length === 0;

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
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed"
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
              <div key={chore.id} className="p-4 bg-slate-700 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-lg mb-2">{chore.name}</h4>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-slate-300 border-slate-500 bg-slate-600">
                        {chore.frequency}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getAssigneeColor(chore.assignee_name || '')}`}></div>
                        <span className="text-sm text-slate-300">
                          {chore.assignee_name}'s turn
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleCompleteChore(chore.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Done
                    </Button>
                    <ContextMenu>
                      <ContextMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="bg-slate-700 border-slate-600">
                        <ContextMenuItem 
                          className="text-red-400 hover:text-red-300 hover:bg-slate-600 cursor-pointer"
                          onClick={() => handleDeleteChore(chore.id)}
                        >
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </div>
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
