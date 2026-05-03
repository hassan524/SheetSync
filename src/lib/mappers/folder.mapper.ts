import { FolderWithSheets } from "@/types";

export const mapFolders = (folders: any[]): FolderWithSheets[] => {
  return folders.map((folder) => ({
    id: folder.id,
    name: folder.name,

    owner_id: folder.owner_id,
    is_personal: folder.is_personal ?? true,
    organization_id: folder.organization_id ?? null,

    created_at: folder.created_at,
    updated_at: folder.updated_at,

    sheets: (folder.sheets ?? []).map((sheet: any) => {
      const ownerName = sheet.owner?.name?.trim();

      const initials =
        ownerName && ownerName.length > 0
          ? ownerName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
          : "?";

      return {
        id: sheet.id,
        title: sheet.title,

        folder_id: sheet.folder_id ?? null,
        owner_id: sheet.owner_id,
        organization_id: sheet.organization_id ?? null,

        template_id: sheet.template_id ?? "",
        is_starred: sheet.is_starred ?? false,
        is_personal: sheet.is_personal ?? true,

        last_modified_by: sheet.last_modified_by ?? sheet.owner_id ?? null,

        created_at: sheet.created_at,
        updated_at: sheet.updated_at,

        size_mb: sheet.size_mb ?? 0,

        owner: sheet.owner
          ? {
              id: sheet.owner.id,
              name: sheet.owner.name ?? "Unknown",
              email: sheet.owner.email ?? "",
              avatar: sheet.owner.avatar_url ?? undefined,
              initials,
            }
          : {
              id: sheet.owner_id,
              name: "Unknown",
              email: "",
              avatar: undefined,
              initials: "?",
            },

        visibility: sheet.visibility ?? "private",

        // ✅ FIX: ALWAYS string (prevents TS error)
        lastModified: sheet.updated_at ? String(sheet.updated_at) : undefined,

        lastModifiedBy: sheet.last_modified_by ?? sheet.owner_id ?? null,

        collaborators: sheet.collaborators ?? 0,
        activeEditors: sheet.activeEditors ?? 0,

        // optional but safe string conversion
        LastOpenedAt: sheet.last_opened_at
          ? String(sheet.last_opened_at)
          : undefined,

        size: `${sheet.size_mb ?? 0} MB`,

        rows: Array.isArray(sheet.rows) ? sheet.rows.length : (sheet.rows ?? 0),

        columns: Array.isArray(sheet.columns)
          ? sheet.columns.length
          : (sheet.columns ?? 0),
      };
    }),
  }));
};
