
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchHouseholdsFromDB, createHouseholdInDB, deleteHouseholdFromDB } from '@/services/householdService';
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

  const deleteHousehold = async (householdId: string) => {
    if (!user) {
      console.error('No user found, cannot delete household');
      return false;
    }

    try {
      const success = await deleteHouseholdFromDB(user.id, householdId);
      if (success) {
        // Remove the household from local state immediately for better UX
        setHouseholds(prevHouseholds => 
          prevHouseholds.filter(h => h.id !== householdId)
        );
        
        // Also refresh from server to ensure consistency
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
    deleteHousehold,
    refetch: fetchHouseholds
  };
};
