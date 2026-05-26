import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SIAROM CRM",
  description: "CRM com calculadora, kanban, tarefas e dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
