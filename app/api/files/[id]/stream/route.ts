import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { extDe, resolverMime } from "@/lib/mime";

const BUCKET = "siarom-files";

export const dynamic = "force-dynamic";

/**
 * Faz proxy de arquivos do Storage com Content-Type corrigido.
 * Necessário para que <img>/<video>/<audio> renderizem inline arquivos antigos
 * cujo contentType foi gravado como "application/<ext>" no upload.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await requireSession();
  const supabase = createClient();
  const { data: file, error: dbErr } = await supabase
    .from("siarom_crm_files")
    .select("storage_path, mime, nome")
    .eq("id", params.id)
    .single();
  if (dbErr || !file) return new NextResponse("Arquivo não encontrado", { status: 404 });

  const admin = supabaseAdmin();
  const { data: blob, error: dlErr } = await admin.storage
    .from(BUCKET)
    .download(file.storage_path as string);
  if (dlErr || !blob) return new NextResponse(dlErr?.message ?? "Falha ao carregar", { status: 500 });

  const ext = extDe(file.nome as string);
  const mime = resolverMime(file.mime as string | null, ext);
  const nomeEnc = encodeURIComponent(file.nome as string);

  return new NextResponse(blob.stream(), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename*=UTF-8''${nomeEnc}`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
