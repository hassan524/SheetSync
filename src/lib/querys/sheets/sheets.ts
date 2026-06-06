"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/querys/profiles/ensure-profile";
import { getTemplateData } from "@/lib/sheet-templates";
import { saveAllRows } from "../sheet/rows";
import { saveAllColumns } from "../sheet/columns";
import { getInitials } from "@/lib/utils";

import { z } from "zod";

// Validation schemas
const createSheetSchema = z.object({
  name: z
    .string()
    .min(1, "Sheet name cannot be empty")
    .max(100, "Sheet name must be less than 100 characters"),
});

const renameSheetSchema = z.object({
  sheet_id: z.string(),
  newName: z.string().min(1).max(100),
});

// ── Get all sheets
export async function getAllSheets(folderId?: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const query = supabase
    .from("sheets")
    .select(
      `
      *,
      owner:profiles!sheets_owner_id_fkey (
        id,
        name,
        email,
        avatar_url
      ),
      organizations (
        id,
        name,
        organization_members (
          id,
          status,
          profiles (
            id,
            name,
            email,
            avatar_url
          )
        )
      ),
      rows ( id ),
      columns ( id )
    `,
    )
    .is("forked_from_sheet_id", null)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []).map((sheet: any) => {
    const org = Array.isArray(sheet.organizations)
      ? sheet.organizations[0]
      : sheet.organizations;
    const ownerName = sheet.owner?.name ?? "Unknown";

    return {
      ...sheet,
      folder: null,
      organization: org
        ? {
            id: org.id,
            name: org.name,
            members: (org.organization_members ?? []).map((member: any) => ({
              id: member.profiles?.id ?? member.id,
              name: member.profiles?.name ?? "Member",
              email: member.profiles?.email ?? "",
              avatar: member.profiles?.avatar_url ?? null,
              status: member.status ?? "offline",
            })),
          }
        : null,
      owner: {
        name: ownerName,
        email: sheet.owner?.email ?? "",
        avatar: sheet.owner?.avatar_url ?? undefined,
        initials: getInitials(ownerName),
      },
      rows: Array.isArray(sheet.rows) ? sheet.rows.length : sheet.rows,
      columns: Array.isArray(sheet.columns)
          ? sheet.columns.length
          : sheet.columns,
    };
  });
}

// ── Get single sheet by ID
export async function getPersonalSheetOptions() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("sheets")
    .select("id, title, updated_at")
    .is("forked_from_sheet_id", null)
    .eq("owner_id", user.id)
    .is("organization_id", null)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function importPersonalSheetToOrganization({
  sourceSheetId,
  organizationId,
}: {
  sourceSheetId: string;
  organizationId: string;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error("You do not have access to this organization.");
  }

  const { data: source, error: sourceError } = await supabase
    .from("sheets")
    .select("*")
    .eq("id", sourceSheetId)
    .eq("owner_id", user.id)
    .is("organization_id", null)
    .single();

  if (sourceError || !source) throw new Error("Personal sheet not found.");

  const [
    { data: columns, error: columnsError },
    { data: rows, error: rowsError },
    { data: formulas, error: formulasError },
    { data: formats, error: formatsError },
    { data: protectedRows, error: protectedError },
  ] = await Promise.all([
    supabase
      .from("columns")
      .select("*")
      .eq("sheet_id", sourceSheetId)
      .order("position"),
    supabase
      .from("rows")
      .select("*")
      .eq("sheet_id", sourceSheetId)
      .order("position"),
    supabase.from("formulas").select("*").eq("sheet_id", sourceSheetId),
    supabase.from("cell_formats").select("*").eq("sheet_id", sourceSheetId),
    supabase.from("protected_rows").select("*").eq("sheet_id", sourceSheetId),
  ]);

  const readError =
    columnsError ||
    rowsError ||
    formulasError ||
    formatsError ||
    protectedError;
  if (readError) throw new Error(readError.message);

  const { data: created, error: createError } = await supabase
    .from("sheets")
    .insert({
      title: source.title,
      owner_id: user.id,
      organization_id: organizationId,
      template_id: source.template_id,
      last_opened_at: new Date().toISOString(),
      charts: source.charts ?? null,
      row_heights: source.row_heights ?? null,
    })
    .select()
    .single();

  if (createError) throw new Error(createError.message);

  const writes = await Promise.all([
    columns?.length
      ? supabase.from("columns").insert(
          columns.map((col: any) => ({
            sheet_id: created.id,
            column_key: col.column_key,
            name: col.name,
            type: col.type,
            width: col.width,
            position: col.position,
            select_options: col.select_options,
            currency_code: col.currency_code,
            frozen: col.frozen,
            hidden: col.hidden,
            conditional_formatting: col.conditional_formatting,
            group_id: col.group_id,
            validation_rules: col.validation_rules,
          })),
        )
      : Promise.resolve({ error: null }),
    rows?.length
      ? supabase.from("rows").insert(
          rows.map((row: any) => ({
            sheet_id: created.id,
            row_key: row.row_key,
            position: row.position,
            data: row.data,
            updated_at: new Date().toISOString(),
          })),
        )
      : Promise.resolve({ error: null }),
    formulas?.length
      ? supabase.from("formulas").insert(
          formulas.map((formula: any) => ({
            sheet_id: created.id,
            cell_key: formula.cell_key,
            formula: formula.formula,
          })),
        )
      : Promise.resolve({ error: null }),
    formats?.length
      ? supabase.from("cell_formats").insert(
          formats.map((format: any) => ({
            sheet_id: created.id,
            cell_key: format.cell_key,
            bold: format.bold,
            italic: format.italic,
            underline: format.underline,
            strikethrough: format.strikethrough,
            font_size: format.font_size,
            font_family: format.font_family,
            text_color: format.text_color,
            bg_color: format.bg_color,
            text_align: format.text_align,
            text_wrap: format.text_wrap,
            border_style: format.border_style,
            border_color: format.border_color,
            border_width: format.border_width,
          })),
        )
      : Promise.resolve({ error: null }),
    protectedRows?.length
      ? supabase.from("protected_rows").insert(
          protectedRows.map((row: any) => ({
            sheet_id: created.id,
            row_key: row.row_key,
            user_id: row.user_id,
            created_at: row.created_at,
          })),
        )
      : Promise.resolve({ error: null }),
  ]);

  const writeError = writes.find((result: any) => result?.error)?.error;
  if (writeError) throw new Error(writeError.message);

  return created;
}

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
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid sheet name";
    throw new Error(errorMsg);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await ensureUserProfile(supabase, user);

  const { data, error } = await supabase
    .from("sheets")
    .insert([
      {
        title: parsed.data.name,
        owner_id: user.id,
        organization_id: organizationId ?? null,
        template_id: templateId,
        last_opened_at: markRecent ? new Date().toISOString() : null,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // ✅ Seed template data immediately so dashboard shows correct counts
  const templateData = getTemplateData(templateId);
  await Promise.all([
    saveAllRows(data.id, templateData.rows, supabase),
    saveAllColumns(data.id, templateData.columns, supabase),
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

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id);
  const orgIds = (memberships ?? [])
    .map((membership: any) => membership.organization_id)
    .filter(Boolean);

  let query = supabase
    .from("sheets")
    .select(
      `
      id, title, template_id, is_starred,
      created_at, updated_at, last_opened_at,
      organization_id, size_mb,
      organizations (
        id,
        name,
        organization_members (
          id,
          status,
          profiles (
            id,
            name,
            email,
            avatar_url
          )
        )
      ),
      columns ( id )
    `,
    )
    .is("forked_from_sheet_id", null)
    .not("last_opened_at", "is", null)
    .order("last_opened_at", { ascending: false });

  const ownershipFilters = [`owner_id.eq.${user.id}`];
  if (orgIds.length > 0) {
    ownershipFilters.push(`organization_id.in.(${orgIds.join(",")})`);
  }
  query = query.or(ownershipFilters.join(","));

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((sheet: any) => {
    const org = sheet.organizations?.[0] ?? null;

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
            members: (org.organization_members ?? []).map((member: any) => ({
              id: member.profiles?.id ?? member.id,
              name: member.profiles?.name ?? "Member",
              email: member.profiles?.email ?? "",
              avatar: member.profiles?.avatar_url ?? null,
              status: member.status ?? "offline",
            })),
          }
        : null,
      folder: null,
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
      organization_id, size_mb,
      organizations (
        id,
        name,
        organization_members (
          id,
          status,
          profiles (
            id,
            name,
            email,
            avatar_url
          )
        )
      ),
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
            members: (org.organization_members ?? []).map((member: any) => ({
              id: member.profiles?.id ?? member.id,
              name: member.profiles?.name ?? "Member",
              email: member.profiles?.email ?? "",
              avatar: member.profiles?.avatar_url ?? null,
              status: member.status ?? "offline",
            })),
          }
        : null,
      folder: null,
      rowsCount: sheet.rows?.length ?? 0,
      colsCount: sheet.columns?.length ?? 0,
      isStarred: true,
    };
  });
}
