
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Chore } from '@/types/chore';
import { choreService } from '@/services/choreService';

export const useChores = (householdId: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChores = async () => {
    if (!householdId || !user) return;

    try {
      setLoading(true);
      const choresData = await choreService.fetchChores(householdId);
      setChores(choresData);
    } catch (error) {
      console.error('Error fetching chores:', error);
      toast({
        title: "Error",
        description: "Failed to load chores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createChore = async (name: string, frequency: string, assigneeId: string) => {
    if (!householdId || !user) return null;

    try {
      const data = await choreService.createChore(householdId, name, frequency, assigneeId, user.id);
      
      toast({
        title: "Success",
        description: "Chore created successfully"
      });

      fetchChores(); // Refresh the list
      return data;
    } catch (error) {
      console.error('Error creating chore:', error);
      toast({
        title: "Error",
        description: "Failed to create chore",
        variant: "destructive"
      });
      return null;
    }
  };

  const completeChore = async (choreId: string) => {
    if (!user) return false;

    try {
      await choreService.completeChore(choreId, user.id);
      
      toast({
        title: "Chore completed! 🎉",
        description: "Great job! The task has been rotated to the next person."
      });

      fetchChores(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error completing chore:', error);
      toast({
        title: "Error",
        description: "Failed to complete chore",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteChore = async (choreId: string) => {
    if (!user) return false;

    try {
      await choreService.deleteChore(choreId);
      
      toast({
        title: "Success",
        description: "Chore deleted successfully"
      });

      fetchChores(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Error deleting chore:', error);
      toast({
        title: "Error",
        description: "Failed to delete chore",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchChores();
  }, [householdId, user]);

  return {
    chores,
    loading,
    createChore,
    completeChore,
    deleteChore,
    refetch: fetchChores
  };
};
