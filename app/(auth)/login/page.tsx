"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassButton, GlassInput, Label } from "@/components/ui/glass";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErro(error.message);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-login flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png?v=2" alt="SIAROM" width={90} height={60} style={{ height: "auto" }} />
          <h1 className="text-3xl font-bold text-white mt-3">SIAROM CRM</h1>
          <p className="text-emerald-200/80 text-sm text-center mt-2 max-w-xs">
            Da conversa à conversão — relatórios e inteligência nos seus atendimentos.
          </p>
        </div>

        <div className="relative card p-7 bg-white/85">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-neutral-100">Entrar na conta</h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mb-5">Use o e-mail e a senha cadastrados.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <GlassInput id="email" type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <GlassInput id="password" type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {erro && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{erro}</div>}
            <GlassButton type="submit" disabled={loading} className="w-full">{loading ? "Entrando..." : "Entrar"}</GlassButton>
          </form>
        </div>

        <p className="text-center text-xs text-emerald-200/70 mt-6">Siarom CRM © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
