export type Asset = {
  id: string;
  type: 'vehicle' | 'home' | 'device' | 'appliance' | 'animal' | 'person' | 'subscription' | 'property' | 'investment' | 'other';
  name: string;
  identifier: string | null;
  custom_icon: string | null;
  template_key: string | null; // Nuovo campo per il template del bene
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
  description?: string | null;
  user_id?: string;
}; 