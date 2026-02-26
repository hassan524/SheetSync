// lib/types.ts
export interface Sheet {
  id: string;
  title: string;
  owner: {
    name: string;
    initials: string;
    avatar?: string;
  };
  folder_id: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  template_id: string;
  organization_id: string;
  is_starred: boolean;
  is_personal: boolean;
  last_modified_by: string;
  collaborators?: number;
  activeEditors: number;
}

// Folder type with sheets nested
export interface FolderWithSheets {
  id: string;
  name: string;
  owner_id: string;
  is_personal: boolean;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
  sheets: Sheet[];
}
