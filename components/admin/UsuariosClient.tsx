"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, GlassButton, GlassInput, GlassSelect, Label, Badge, Modal } from "@/components/ui/glass";
import { criarUsuario, atualizarUsuario, resetarSenha } from "@/lib/actions/admin";
import type { Profile } from "@/types/database";

export function UsuariosClient({ usuarios }: { usuarios: Profile[] }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const criar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErro(null);
    start(async () => {
      const r = await criarUsuario(fd);
      if (r?.error) return setErro(r.error);
      setOpen(false);
      router.refresh();
      (e.target as HTMLFormElement).reset();
    });
  };

  const atualizar = (id: string, fd: FormData) => {
    start(async () => {
      const r = await atualizarUsuario(id, fd);
      if (r?.error) return setErro(r.error);
      router.refresh();
    });
  };

  const resetar = async (id: string) => {
    const s = prompt("Nova senha (mínimo 6 caracteres):");
    if (!s) return;
    const r = await resetarSenha(id, s);
    if (r?.error) alert(r.error); else alert("Senha redefinida.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold title-grad">Usuários</h1>
        <GlassButton onClick={() => setOpen(true)}>+ Novo usuário</GlassButton>
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setErro(null); }} title="Novo usuário" size="md">
        <form onSubmit={criar} className="space-y-3">
          <div><Label htmlFor="nome">Nome</Label><GlassInput id="nome" name="nome" required autoFocus /></div>
          <div><Label htmlFor="email">Email</Label><GlassInput id="email" name="email" type="email" required /></div>
          <div><Label htmlFor="password">Senha</Label><GlassInput id="password" name="password" type="password" minLength={6} required /></div>
          <div>
            <Label htmlFor="role">Papel</Label>
            <GlassSelect id="role" name="role" defaultValue="user">
              <option value="user">Usuário</option>
              <option value="admin">Admin</option>
            </GlassSelect>
          </div>
          {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{erro}</div>}
          <div className="flex gap-2 justify-end pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</GlassButton>
            <GlassButton type="submit" disabled={pending}>{pending ? "Criando..." : "Criar"}</GlassButton>
          </div>
        </form>
      </Modal>

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Papel</th>
              <th className="text-left px-4 py-2">Ativo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-white/5">
                <td className="px-4 py-2">
                  <form action={(fd: FormData) => atualizar(u.id, fd)} className="flex gap-2 items-center" id={`f-${u.id}`}>
                    <input name="nome" defaultValue={u.nome} className="bg-transparent border-none p-0 focus:ring-0 w-40" />
                  </form>
                </td>
                <td className="px-4 py-2 text-slate-400">{u.email}</td>
                <td className="px-4 py-2">
                  <select form={`f-${u.id}`} name="role" defaultValue={u.role} className="bg-white/5 border-white/10 text-xs">
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <label className="inline-flex items-center gap-2">
                    <input form={`f-${u.id}`} type="checkbox" name="ativo" defaultChecked={u.ativo} />
                    {u.ativo ? <Badge tone="green">ativo</Badge> : <Badge tone="red">inativo</Badge>}
                  </label>
                </td>
                <td className="px-4 py-2 text-right flex gap-2 justify-end">
                  <GlassButton form={`f-${u.id}`} type="submit" variant="ghost">Salvar</GlassButton>
                  <GlassButton type="button" variant="ghost" onClick={() => resetar(u.id)}>Resetar senha</GlassButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </GlassCard>
    </div>
  );
}
