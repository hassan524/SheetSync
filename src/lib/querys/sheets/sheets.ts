"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
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
}: {
  name: string;
  folder_id?: string;
  templateId: string;
  organizationId?: string;
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
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

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
