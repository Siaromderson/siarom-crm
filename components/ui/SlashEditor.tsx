"use client";
import { useEffect, useRef, useState } from "react";
import { CheckSquare, Type as TypeIcon } from "lucide-react";

/**
 * Mini editor estilo Notion para a descrição.
 * Armazena como markdown:
 *   - "- [ ] item"  → checklist desmarcado
 *   - "- [x] item"  → checklist marcado
 *   - "texto"        → linha de texto
 * Digite "/" no início de uma linha vazia para abrir o menu de comandos.
 */

type BlockType = "text" | "todo";
interface Block { id: string; type: BlockType; text: string; checked: boolean }

const uid = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

function parse(value: string): Block[] {
  if (!value.trim()) return [{ id: uid(), type: "text", text: "", checked: false }];
  return value.split("\n").map((line) => {
    const m = /^\s*-\s*\[( |x|X)\]\s?(.*)$/.exec(line);
    if (m) return { id: uid(), type: "todo" as const, text: m[2], checked: m[1].toLowerCase() === "x" };
    return { id: uid(), type: "text" as const, text: line, checked: false };
  });
}

function serialize(blocks: Block[]): string {
  return blocks
    .map((b) => (b.type === "todo" ? `- [${b.checked ? "x" : " "}] ${b.text}` : b.text))
    .join("\n");
}

const COMMANDS: { id: BlockType; label: string; hint: string; keywords: string[]; icon: typeof CheckSquare }[] = [
  { id: "todo", label: "Lista de tarefas", hint: "Checklist com caixas pra marcar", keywords: ["lista", "todo", "check", "tarefa"], icon: CheckSquare },
  { id: "text", label: "Texto", hint: "Parágrafo simples", keywords: ["texto", "text", "paragrafo"], icon: TypeIcon },
];

export function SlashEditor({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [blocks, setBlocks] = useState<Block[]>(() => parse(value));
  const [menuIdx, setMenuIdx] = useState(0);
  const lastSerialized = useRef(value);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (value !== lastSerialized.current) {
      setBlocks(parse(value));
      lastSerialized.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (focusId && inputs.current[focusId]) {
      const el = inputs.current[focusId]!;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
      setFocusId(null);
    }
  }, [focusId, blocks]);

  const commit = (next: Block[]) => {
    setBlocks(next);
    const s = serialize(next);
    lastSerialized.current = s;
    onChange(s);
  };

  const setBlock = (id: string, patch: Partial<Block>) =>
    commit(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const menuQuery = (b: Block) => (b.text.startsWith("/") ? b.text.slice(1).toLowerCase() : null);
  const filteredCommands = (q: string) =>
    COMMANDS.filter((c) => !q || c.label.toLowerCase().includes(q) || c.keywords.some((k) => k.includes(q)));

  const aplicarComando = (id: string, cmd: BlockType) => {
    commit(blocks.map((b) => (b.id === id ? { ...b, type: cmd, text: "", checked: false } : b)));
    setMenuIdx(0);
    setFocusId(id);
  };

  const onKeyDown = (b: Block, e: React.KeyboardEvent<HTMLInputElement>) => {
    const q = menuQuery(b);
    const menuOpen = q !== null;
    const filtered = menuOpen ? filteredCommands(q!) : [];

    if (menuOpen && filtered.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMenuIdx((i) => (i + 1) % filtered.length); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setMenuIdx((i) => (i - 1 + filtered.length) % filtered.length); return; }
      if (e.key === "Enter")     { e.preventDefault(); aplicarComando(b.id, filtered[Math.min(menuIdx, filtered.length - 1)].id); return; }
      if (e.key === "Escape")    { e.preventDefault(); setBlock(b.id, { text: "" }); return; }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const novo: Block = { id: uid(), type: b.type, text: "", checked: false };
      const i = blocks.findIndex((x) => x.id === b.id);
      const next = [...blocks.slice(0, i + 1), novo, ...blocks.slice(i + 1)];
      commit(next);
      setFocusId(novo.id);
      return;
    }

    if (e.key === "Backspace" && b.text === "" && e.currentTarget.selectionStart === 0) {
      const i = blocks.findIndex((x) => x.id === b.id);
      // se é todo vazio, primeiro vira texto; se já é texto vazio, remove
      if (b.type === "todo") { e.preventDefault(); setBlock(b.id, { type: "text" }); return; }
      if (blocks.length > 1) {
        e.preventDefault();
        const prev = blocks[i - 1];
        const next = blocks.filter((x) => x.id !== b.id);
        commit(next);
        if (prev) setFocusId(prev.id);
      }
    }
  };

  return (
    <div className="w-full rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2.5 space-y-0.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition">
      {blocks.map((b) => {
        const q = menuQuery(b);
        const menuOpen = q !== null;
        const filtered = menuOpen ? filteredCommands(q!) : [];
        return (
          <div key={b.id} className="relative">
            <div className="flex items-start gap-2 group">
              {b.type === "todo" && (
                <input
                  type="checkbox"
                  checked={b.checked}
                  onChange={(e) => setBlock(b.id, { checked: e.target.checked })}
                  className="mt-[3px] w-4 h-4 shrink-0 rounded border-slate-300 dark:border-neutral-600 text-emerald-600 focus:ring-emerald-500/30 cursor-pointer accent-emerald-600"
                />
              )}
              <input
                ref={(el) => { inputs.current[b.id] = el; }}
                value={b.text}
                onChange={(e) => { setBlock(b.id, { text: e.target.value }); setMenuIdx(0); }}
                onKeyDown={(e) => onKeyDown(b, e)}
                placeholder={blocks.length === 1 && b.text === "" ? (placeholder ?? "Escreva algo, ou digite / para comandos…") : ""}
                className={`flex-1 min-w-0 bg-transparent border-0 outline-none p-0 px-0 py-0.5 text-sm focus:ring-0 ${
                  b.type === "todo" && b.checked ? "line-through text-slate-400 dark:text-neutral-500" : "text-slate-800 dark:text-neutral-100"
                }`}
              />
            </div>

            {menuOpen && filtered.length > 0 && (
              <div className="absolute z-20 mt-1 left-0 w-64 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-neutral-800">Blocos</div>
                {filtered.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); aplicarComando(b.id, c.id); }}
                      onMouseEnter={() => setMenuIdx(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${i === Math.min(menuIdx, filtered.length - 1) ? "bg-emerald-50 dark:bg-emerald-950/40" : "hover:bg-slate-50 dark:hover:bg-neutral-800"}`}
                    >
                      <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 dark:text-neutral-100">{c.label}</div>
                        <div className="text-xs text-slate-500 dark:text-neutral-400 truncate">{c.hint}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
