import { Sidebar } from "@/components/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { requireSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireSession();
  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar nome={profile.nome} role={profile.role} />
        <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
      </div>
    </ToastProvider>
  );
}
