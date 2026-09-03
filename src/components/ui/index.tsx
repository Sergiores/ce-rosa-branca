import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* -------------------------------------------------- Botao */

const botaoVariantes = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azul-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variante: {
        primario:
          "bg-azul-600 text-white shadow-md shadow-azul-600/20 hover:bg-azul-700 hover:shadow-lg hover:shadow-azul-600/25",
        suave: "bg-azul-100 text-azul-800 hover:bg-azul-200",
        contorno:
          "border border-azul-200 bg-white text-azul-700 hover:border-azul-300 hover:bg-azul-50",
        fantasma: "text-azul-700 hover:bg-azul-50",
        perigo: "bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-700",
      },
      tamanho: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
        icone: "h-10 w-10",
      },
    },
    defaultVariants: { variante: "primario", tamanho: "md" },
  },
);

export type BotaoProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof botaoVariantes>;

export function Botao({ className, variante, tamanho, ...props }: BotaoProps) {
  return <button className={cn(botaoVariantes({ variante, tamanho }), className)} {...props} />;
}

export function BotaoLink({
  className,
  variante,
  tamanho,
  href,
  ...props
}: React.ComponentProps<typeof Link> & VariantProps<typeof botaoVariantes>) {
  return (
    <Link href={href} className={cn(botaoVariantes({ variante, tamanho }), className)} {...props} />
  );
}

/* -------------------------------------------------- Cartao */

export function Cartao({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-borda bg-superficie shadow-sm shadow-azul-900/5 transition-shadow",
        className,
      )}
      {...props}
    />
  );
}

export function CartaoCabecalho({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-borda px-6 py-4", className)} {...props} />;
}

export function CartaoTitulo({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold text-texto", className)} {...props} />;
}

export function CartaoCorpo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}

/* -------------------------------------------------- Etiqueta / Badge */

const etiquetaVariantes = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tom: {
        azul: "bg-azul-100 text-azul-800",
        verde: "bg-emerald-100 text-emerald-800",
        ambar: "bg-amber-100 text-amber-800",
        vermelho: "bg-rose-100 text-rose-800",
        cinza: "bg-slate-100 text-slate-700",
      },
    },
    defaultVariants: { tom: "azul" },
  },
);

export function Etiqueta({
  className,
  tom,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof etiquetaVariantes>) {
  return <span className={cn(etiquetaVariantes({ tom }), className)} {...props} />;
}

/* -------------------------------------------------- Campos */

const campoBase =
  "w-full rounded-xl border border-borda bg-white px-4 py-2.5 text-sm text-texto placeholder:text-texto-suave/60 transition-colors focus:border-azul-400 focus:outline-none focus:ring-2 focus:ring-azul-100 disabled:bg-slate-50";

export function Campo({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(campoBase, className)} {...props} />;
}

export function AreaTexto({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(campoBase, "min-h-28 resize-y", className)} {...props} />;
}

export function Selecao({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(campoBase, "pr-8", className)} {...props} />;
}

export function Rotulo({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-texto-suave", className)}
      {...props}
    />
  );
}

/* -------------------------------------------------- Estruturais */

export function TituloSecao({
  titulo,
  descricao,
  className,
}: {
  titulo: string;
  descricao?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8", className)}>
      <h2 className="text-2xl font-semibold tracking-tight text-texto sm:text-3xl">{titulo}</h2>
      {descricao ? <p className="mt-2 max-w-2xl text-texto-suave">{descricao}</p> : null}
    </div>
  );
}

export function Vazio({ mensagem }: { mensagem: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-borda bg-white/60 px-6 py-12 text-center text-sm text-texto-suave">
      {mensagem}
    </div>
  );
}
