import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getSessionAndProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null as Profile | null };

  const { data: profile } = await supabase
    .from("siarom_crm_profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return { user, profile };
}

export async function requireSession() {
  const { user, profile } = await getSessionAndProfile();
  if (!user || !profile || !profile.ativo) redirect("/login");
  return { user, profile: profile! };
}

export async function requireAdmin() {
  const { profile } = await requireSession();
  if (profile.role !== "admin") redirect("/tarefas");
  return profile;
}
