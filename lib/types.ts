export interface AssetCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  sort_order: number;
  asset_types?: AssetType[];
}

export interface AssetType {
  id: string;
  name: string;
  description?: string;
  icon: string;
  asset_category_id: string;
  sort_order: number;
  asset_category?: AssetCategory;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  asset_category_id?: string;
  asset_type_id?: string;
  identifier?: string;
  custom_icon?: string;
  template_key?: string;
  created_at: string;
  updated_at: string;
  asset_category?: AssetCategory;
  asset_type?: AssetType;
}

export type Deadline = {
  id: string;
  title: string;
  due_at: string;
  status: 'pending' | 'done';
  recurrence_rule: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id?: string;
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