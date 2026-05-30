"use client";
import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";

type ActionResult = { error?: string; ok?: boolean } | void | null | undefined;

interface RunOptions<T> {
  /** Aplica a mudança otimista na UI e retorna um token usado no rollback. */
  apply: () => T;
  /** Reverte a UI para o estado anterior usando o token de apply(). */
  rollback: (token: T) => void;
  /** Dispara a requisição ao servidor em segundo plano. */
  action: () => Promise<ActionResult>;
  /** Mensagem do aviso discreto exibido no erro (sobrescreve a do servidor). */
  errorMessage?: string;
  /** Executado após sucesso confirmado (ex: router.refresh()). */
  onSuccess?: () => void;
}

/**
 * Padrão único de UI otimista: aplica a mudança na hora, dispara a action em
 * background e, no erro, reverte (rollback) + mostra um toast discreto.
 */
export function useOptimisticAction() {
  const [pending, start] = useTransition();
  const toast = useToast();

  function run<T>({ apply, rollback, action, errorMessage, onSuccess }: RunOptions<T>) {
    const token = apply();
    start(async () => {
      try {
        const r = await action();
        if (r && r.error) {
          rollback(token);
          toast.error(errorMessage ?? r.error);
          return;
        }
        onSuccess?.();
      } catch {
        rollback(token);
        toast.error(errorMessage ?? "Algo deu errado. Tente novamente.");
      }
    });
  }

  return { run, pending };
}
