"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTemplateData } from "@/lib/sheet-templates";
import { saveAllRows } from "../sheet/rows";
import { saveAllColumns } from "../sheet/columns";

import { z } from "zod";

// Validation schemas
const createSheetSchema = z.object({
  name: z.string().min(5).max(100),
});

const renameSheetSchema = z.object({
  sheet_id: z.string(),
  newName: z.string().min(1).max(100),
});

// ── Get all sheets, optionally by folder
export async function getAllSheets(folderId?: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  let query = supabase
    .from("sheets")
    .select("*")
    .is("forked_from_sheet_id", null)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (folderId) {
    query = query.eq("folder_id", folderId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}

// ── Get single sheet by ID
export async function getSheetById(sheetId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("sheets")
    .select("*")
    .eq("id", sheetId)
    .eq("owner_id", user.id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Create new sheet
export async function createSheet({
  name,
  folder_id,
  templateId,
  organizationId,
  markRecent,
}: {
  name: string;
  folder_id?: string;
  templateId: string;
  organizationId?: string;
  markRecent?: boolean;
}) {
  const supabase = await createSupabaseServerClient();

  const parsed = createSheetSchema.safeParse({ name });
  if (!parsed.success) throw new Error("Invalid sheet name");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("sheets")
    .insert([
      {
        title: parsed.data.name,
        folder_id: folder_id ?? null,
        owner_id: user.id,
        organization_id: organizationId ?? null,
        template_id: templateId,
        is_personal: !organizationId,
        last_opened_at: markRecent ? new Date().toISOString() : null,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // ✅ Seed template data immediately so dashboard shows correct counts
  const templateData = getTemplateData(templateId);
  await Promise.all([
    saveAllRows(data.id, templateData.rows),
    saveAllColumns(data.id, templateData.columns),
  ]);

  return data;
}

// ── Rename sheet
export async function renameSheet(input: {
  sheet_id: string;
  newName: string;
}) {
  const supabase = await createSupabaseServerClient();
  const parsed = renameSheetSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid sheet rename data");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("sheets")
    .update({ name: parsed.data.newName })
    .eq("id", parsed.data.sheet_id)
    .eq("owner_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Delete sheet
export async function deleteSheet(sheetId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("sheets")
    .delete()
    .eq("id", sheetId)
    .eq("owner_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getRecentSheets(limit?: number) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  let query = supabase
    .from("sheets")
    .select(
      `
      id, title, template_id, is_starred,
      created_at, updated_at, last_opened_at,
      organization_id, folder_id, size_mb,
      folders ( id, name ),
      organizations ( id, name, organization_members ( id ) ),
      columns ( id )
    `,
    )
    .is("forked_from_sheet_id", null)
    .eq("owner_id", user.id)
    .not("last_opened_at", "is", null)
    .order("last_opened_at", { ascending: false });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((sheet: any) => {
    const org = sheet.organizations?.[0] ?? null;
    const folder = sheet.folders?.[0] ?? null;

    return {
      id: sheet.id,
      title: sheet.title,
      templateId: sheet.template_id,
      lastEdited: sheet.last_opened_at ?? sheet.updated_at,
      createdAt: sheet.created_at,
      isOrganization: !!sheet.organization_id,
      organization: org
        ? {
            id: org.id,
            name: org.name,
            membersCount: org.organization_members?.length ?? 0,
          }
        : null,
      folder: folder ? { id: folder.id, name: folder.name } : null,
      rowsCount: sheet.rows?.length ?? 0,
      colsCount: sheet.columns?.length ?? 0,
      isStarred: !!sheet.is_starred,
    };
  });
}

export async function getStarredSheets() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("sheets")
    .select(
      `
      id, title, template_id, is_starred,
      created_at, updated_at, last_opened_at,
      organization_id, folder_id, size_mb,
      folders ( id, name ),
      organizations ( id, name, organization_members ( id ) ),
      rows ( id ),
      columns ( id )
    `,
    )
    .is("forked_from_sheet_id", null)
    .eq("owner_id", user.id)
    .eq("is_starred", true)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((sheet: any) => {
    const org = sheet.organizations?.[0] ?? null;
    const folder = sheet.folders?.[0] ?? null;

    return {
      id: sheet.id,
      title: sheet.title,
      templateId: sheet.template_id,
      lastEdited: sheet.updated_at,
      createdAt: sheet.created_at,
      isOrganization: !!sheet.organization_id,
      organization: org
        ? {
            id: org.id,
            name: org.name,
            membersCount: org.organization_members?.length ?? 0,
          }
        : null,
      folder: folder ? { id: folder.id, name: folder.name } : null,
      rowsCount: sheet.rows?.length ?? 0,
      colsCount: sheet.columns?.length ?? 0,
      isStarred: true,
    };
  });
}
