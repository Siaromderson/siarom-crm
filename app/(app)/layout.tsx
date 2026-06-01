import { Sidebar } from "@/components/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireSession();
  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar nome={profile.nome} role={profile.role} />
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8 pt-[72px] lg:pt-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
