
export interface Chore {
  id: string;
  household_id: string;
  name: string;
  frequency: string;
  current_assignee_id: string;
  created_at: string;
  updated_at: string;
  last_completed_at: string | null;
  created_by: string;
  assignee_name?: string;
}
