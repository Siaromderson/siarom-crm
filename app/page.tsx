import { redirect } from "next/navigation";
import { getSessionAndProfile } from "@/lib/auth";

export default async function Home() {
  const { user, profile } = await getSessionAndProfile();
  if (!user || !profile) redirect("/login");
  redirect(profile.role === "admin" ? "/dashboard" : "/tarefas");
}
