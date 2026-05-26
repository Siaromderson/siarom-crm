import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { UsuariosClient } from "@/components/admin/UsuariosClient";
import type { Profile } from "@/types/database";

export default async function Page() {
  await requireAdmin();
  const { data } = await supabaseAdmin()
    .from("siarom_crm_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return <UsuariosClient usuarios={(data ?? []) as Profile[]} />;
}
