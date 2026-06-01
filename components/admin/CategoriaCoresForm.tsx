"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GlassButton } from "@/components/ui/glass";
import { salvarCategoriaCores, type CategoriaCores } from "@/lib/actions/settings";
import { TASK_CATEGORIAS, type TaskCategoria } from "@/types/database";
import { TONE_LIST, type Tone } from "@/lib/palette";

export function CategoriaCoresForm({ inicial }: { inicial: CategoriaCores }) {
  const router = useRouter();
  const [cores, setCores] = useState<CategoriaCores>(inicial);
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(false);

  const salvar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOk(false);
    const fd = new FormData();
    for (const c of TASK_CATEGORIAS) fd.set(`cor_${c.id}`, cores[c.id]);
    start(async () => {
      const r = await salvarCategoriaCores(fd);
      if (!r?.error) { setOk(true); router.refresh(); }
    });
  };

  const setCor = (cat: TaskCategoria, tone: Tone) =>
    setCores((c) => ({ ...c, [cat]: tone }));

  return (
    <form onSubmit={salvar} className="space-y-5">
      {TASK_CATEGORIAS.map((cat) => (
        <div key={cat.id}>
          <div className="text-sm font-medium text-slate-700 dark:text-neutral-200 mb-2">{cat.label}</div>
          <div className="flex flex-wrap gap-2">
            {TONE_LIST.map((t) => {
              const ativo = cores[cat.id] === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCor(cat.id, t.id)}
                  title={t.label}
                  aria-label={t.label}
                  className={`w-8 h-8 rounded-full transition ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 ${
                    ativo ? "ring-2 ring-slate-400 dark:ring-neutral-300 scale-110" : "hover:scale-105 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: t.hex }}
                />
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-1">
        <GlassButton type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar cores"}</GlassButton>
        {ok && <span className="text-sm text-emerald-600 dark:text-emerald-400">Cores salvas ✓</span>}
      </div>
    </form>
  );
}
