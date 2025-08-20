export type Asset = {
  id: string;
  type: 'vehicles' | 'properties' | 'animals' | 'people' | 'devices' | 'subscriptions' | 'other';
  name: string;
  identifier: string | null;
  custom_icon: string | null;
  created_at: string;
  updated_at: string;
};

export type Deadline = {
  id: string;
  title: string;
  due_at: string;
  status: 'pending' | 'done' | 'skipped';
  recurrence_rrule: string | null;
  notes: string | null;
  asset_id: string | null;
  asset?: { name: string; type?: string; custom_icon?: string | null } | null;
  completed_at: string | null;
  base_due_at: string | null;
  created_at: string;
  updated_at: string;
  user_id?: string; // Campo opzionale che può arrivare dal database
};

export type Document = {
  id: string;
  title: string;
  tags: string[] | null;
  storage_path: string | null;
  asset_id: string | null;
  asset?: { name: string; type?: string; custom_icon?: string | null } | null;
  created_at: string;
  updated_at: string;
  user_id?: string;
}; 