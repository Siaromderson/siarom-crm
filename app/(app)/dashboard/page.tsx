import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { Project } from "@/types/database";

export default async function Page() {
  await requireAdmin();
  const supabase = createClient();
  const { data } = await supabase.from("siarom_crm_projects").select("*").order("created_at", { ascending: false });
  return <DashboardClient projetos={(data ?? []) as Project[]} />;
}
