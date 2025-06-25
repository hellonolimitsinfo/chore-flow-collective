import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchHouseholdsFromDB, createHouseholdInDB, deleteHouseholdFromDB, renameHouseholdInDB, removeMemberFromHousehold } from '@/services/householdService';
import type { Household } from '@/types/household';

export const useHouseholds = () => {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHouseholds = async () => {
    if (!user) {
      console.log('No user found, skipping household fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const householdsData = await fetchHouseholdsFromDB(user.id);
      setHouseholds(householdsData);
    } catch (error) {
      console.error('Error fetching households:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHousehold = async (name: string, description?: string) => {
    if (!user) {
      console.error('No user found, cannot create household');
      return null;
    }

    try {
      const householdData = await createHouseholdInDB(user.id, name, description);
      if (householdData) {
        fetchHouseholds(); // Refresh the list
      }
      return householdData;
    } catch (error) {
      console.error('Error creating household:', error);
      return null;
    }
  };

  const renameHousehold = async (householdId: string, newName: string) => {
    if (!user) {
      console.error('No user found, cannot rename household');
      return false;
    }

    try {
      const success = await renameHouseholdInDB(householdId, newName);
      if (success) {
        setHouseholds(prevHouseholds => 
          prevHouseholds.map(h => 
            h.id === householdId ? { ...h, name: newName } : h
          )
        );
        
        await fetchHouseholds();
      }
      return success;
    } catch (error) {
      console.error('Error renaming household:', error);
      return false;
    }
  };

  const removeMember = async (householdId: string, userId: string) => {
    if (!user) {
      console.error('No user found, cannot remove member');
      return false;
    }

    try {
      const success = await removeMemberFromHousehold(householdId, userId);
      if (success) {
        await fetchHouseholds();
      }
      return success;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  };

  const deleteHousehold = async (householdId: string) => {
    if (!user) {
      console.error('No user found, cannot delete household');
      return false;
    }

    try {
      const success = await deleteHouseholdFromDB(user.id, householdId);
      if (success) {
        setHouseholds(prevHouseholds => 
          prevHouseholds.filter(h => h.id !== householdId)
        );
        
        await fetchHouseholds();
      }
      return success;
    } catch (error) {
      console.error('Error deleting household:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, [user]);

  return {
    households,
    loading,
    createHousehold,
    renameHousehold,
    removeMember,
    deleteHousehold,
    refetch: fetchHouseholds
  };
};
