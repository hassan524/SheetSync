export interface FolderItem {
  id: string;
  name: string;
  sheets: SheetItem[];
  lastEdited: string;
}

export interface SheetItem {
  id: string;
  title: string;
  lastEdited: string;
  isStarred: boolean;
  sharedWith?: number;
  owner: { name: string; initials: string; avatar?: string };
  visibility: "private" | "team" | "public";
  lastModifiedBy: string;
  collaborators: number;
  activeEditors: number;
  size: string;
  folder?: string;
}
