
export interface HouseholdMember {
  user_id: string;
  role: string;
  full_name?: string;
}

export interface Household {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  user_role?: string;
  members?: HouseholdMember[];
}
