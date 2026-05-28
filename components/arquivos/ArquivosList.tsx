"use client";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { FileText, FileSignature, Receipt, Paperclip, Download, Trash2, FileEdit, Eye, X, Loader2 } from "lucide-react";
import { GlassButton, Badge } from "@/components/ui/glass";
import { deletarArquivo, getDownloadUrl, uploadArquivo } from "@/lib/actions/files";
import { brl } from "@/lib/format";
import { FILE_CATEGORIAS, type FileCategoria, type FileOwnerType, type ProjectFile } from "@/types/database";

const iconByCat = { contrato: FileSignature, nfe: Receipt, proposta: FileEdit, outro: Paperclip } as const;

const fmtSize = (b: number | null) => {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

export function UploadDropzone({ ownerType, ownerId, categoria, onUploaded }: {
  ownerType: FileOwnerType; ownerId: string; categoria?: FileCategoria; onUploaded?: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [cat, setCat] = useState<FileCategoria>(categoria ?? "outro");

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErro(null);
    start(async () => {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("owner_type", ownerType);
        fd.set("owner_id", ownerId);
        fd.set("categoria", cat);
        const r = await uploadArquivo(fd);
        if (r?.error) { setErro(r.error); break; }
      }
      router.refresh();
      onUploaded?.();
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <label className="text-xs text-slate-500 dark:text-neutral-400">Categoria:</label>
        {FILE_CATEGORIAS.map((c) => (
          <button key={c.id} type="button" onClick={() => setCat(c.id)}
                  className={`text-xs px-2 py-1 rounded-md border transition ${cat === c.id ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300 font-medium" : "border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:border-slate-300"}`}>
            {c.label}
          </button>
        ))}
      </div>
      <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition ${pending ? "opacity-50 cursor-wait" : "border-slate-300 dark:border-neutral-700 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-neutral-900"}`}>
        <input type="file" multiple className="hidden" disabled={pending} onChange={(e) => handleFiles(e.target.files)} />
        <Paperclip size={24} className="text-slate-400" />
        <div className="text-sm text-slate-600 dark:text-neutral-300 mt-2">{pending ? "Enviando..." : "Clique para anexar arquivos"}</div>
        <div className="text-xs text-slate-400 mt-1">Máx 25 MB por arquivo</div>
      </label>
      {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{erro}</div>}
    </div>
  );
}

export function ArquivosList({ arquivos, onDelete, ownerLabels }: {
  arquivos: ProjectFile[]; onDelete?: () => void;
  /** key = `${owner_type}:${owner_id}`, value = { projeto?, cliente? } */
  ownerLabels?: Record<string, { projeto?: string; cliente?: string }>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [preview, setPreview] = useState<ProjectFile | null>(null);

  const baixar = async (id: string) => {
    const r = await getDownloadUrl(id);
    if (r?.url) window.open(r.url, "_blank");
    else alert(r?.error ?? "Erro ao gerar link.");
  };

  const remover = (id: string) => {
    if (!confirm("Excluir este arquivo?")) return;
    start(async () => {
      const r = await deletarArquivo(id);
      if (r?.error) return alert(r.error);
      router.refresh();
      onDelete?.();
    });
  };

  if (arquivos.length === 0) {
    return <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">Nenhum arquivo ainda.</div>;
  }

  return (
    <div className="space-y-2">
      {arquivos.map((f) => {
        const Icon = iconByCat[f.categoria];
        const tone = f.categoria === "contrato" ? "blue" : f.categoria === "nfe" ? "amber" : f.categoria === "proposta" ? "purple" : "slate";
        return (
          <div key={f.id} className="card p-3 flex items-center gap-3 group hover:border-emerald-300 dark:hover:border-emerald-700 transition">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-slate-800 dark:text-neutral-100 truncate">{f.nome}</div>
              <div className="text-xs text-slate-500 dark:text-neutral-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <Badge tone={tone}>{f.categoria}</Badge>
                <span>{fmtSize(f.size_bytes)}</span>
                <span>{new Date(f.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
              {ownerLabels && (() => {
                const lbl = ownerLabels[`${f.owner_type}:${f.owner_id}`];
                if (!lbl) return null;
                return (
                  <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1 flex flex-wrap gap-3">
                    {lbl.projeto && <span>📁 <b className="font-medium text-slate-700 dark:text-neutral-300">{lbl.projeto}</b></span>}
                    {lbl.cliente && <span>👤 <b className="font-medium text-slate-700 dark:text-neutral-300">{lbl.cliente}</b></span>}
                  </div>
                );
              })()}
            </div>
            <button onClick={() => setPreview(f)} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500" title="Visualizar">
              <Eye size={15} />
            </button>
            <button onClick={() => baixar(f.id)} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500" title="Baixar">
              <Download size={15} />
            </button>
            <button onClick={() => remover(f.id)} disabled={pending} className="p-2 rounded hover:bg-red-50 text-red-500" title="Excluir">
              <Trash2 size={15} />
            </button>
          </div>
        );
      })}
      <FilePreviewModal file={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function FilePreviewModal({ file, onClose }: { file: ProjectFile | null; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!file) { setUrl(null); setErro(null); return; }
    let cancelled = false;
    setUrl(null); setErro(null);
    getDownloadUrl(file.id).then((r) => {
      if (cancelled) return;
      if (r?.url) setUrl(r.url);
      else setErro(r?.error ?? "Falha ao gerar URL.");
    });
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => { cancelled = true; window.removeEventListener("keydown", onEsc); };
  }, [file, onClose]);

  if (!file || !mounted) return null;

  const mime = file.mime ?? "";
  const ext = (file.nome.split(".").pop() ?? "").toLowerCase();
  const isImage = mime.startsWith("image/") || ["png","jpg","jpeg","gif","webp","svg","bmp","avif"].includes(ext);
  const isPdf = mime === "application/pdf" || ext === "pdf";
  const isVideo = mime.startsWith("video/") || ["mp4","webm","ogg","mov"].includes(ext);
  const isAudio = mime.startsWith("audio/") || ["mp3","wav","ogg","m4a","aac"].includes(ext);
  const isText = mime.startsWith("text/") || ["txt","md","csv","json","log","xml","yml","yaml"].includes(ext);

  return createPortal((
    <div
      className="fixed inset-y-0 left-0 right-0 md:right-[620px] lg:right-[720px] xl:right-[820px] z-[60] flex items-stretch p-3 md:p-5 bg-black/40 backdrop-blur-md animate-[fadeIn_.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full rounded-xl border border-white/20 dark:border-neutral-700/60 bg-white/85 dark:bg-neutral-950/85 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-[slideInRight_.2s_cubic-bezier(.2,.8,.2,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/70 dark:border-neutral-800/70">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-slate-800 dark:text-neutral-100 truncate">{file.nome}</div>
            <div className="text-xs text-slate-500 dark:text-neutral-400">{mime || ext.toUpperCase()}</div>
          </div>
          {url && (
            <a href={url} target="_blank" rel="noreferrer"
               className="p-2 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400" title="Abrir em nova aba">
              <Download size={16} />
            </a>
          )}
          <button onClick={onClose} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400" title="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-50/60 dark:bg-neutral-900/40 flex items-center justify-center min-h-0">
          {erro && <div className="text-sm text-red-600 dark:text-red-400 p-6">{erro}</div>}
          {!url && !erro && <Loader2 className="animate-spin text-slate-400" size={28} />}
          {url && isImage && (
            <img src={url} alt={file.nome} className="max-w-full max-h-full object-contain" />
          )}
          {url && isPdf && (
            <iframe src={url} title={file.nome} className="w-full h-full bg-white" />
          )}
          {url && isVideo && (
            <video src={url} controls className="max-w-full max-h-full" />
          )}
          {url && isAudio && (
            <audio src={url} controls className="w-full px-6" />
          )}
          {url && isText && (
            <iframe src={url} title={file.nome} className="w-full h-full bg-white dark:bg-neutral-950" />
          )}
          {url && !isImage && !isPdf && !isVideo && !isAudio && !isText && (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <Paperclip size={36} className="text-slate-400" />
              <div className="text-sm text-slate-600 dark:text-neutral-300">Pré-visualização não suportada para este formato.</div>
              <a href={url} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                <Download size={14} /> Baixar arquivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  ), document.body);
}
