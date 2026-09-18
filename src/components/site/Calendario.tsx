import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatarData } from "@/lib/datas";
import type { Evento } from "@/lib/tipos";

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Data local do evento, sem depender do fuso do servidor para o dia do mes. */
function diaDoMes(iso: string) {
  return new Date(iso).getDate();
}

function chaveMes(ano: number, mes: number) {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

/**
 * Grade de um mes civil. Server component de proposito: a navegacao entre
 * meses e por query string, entao o calendario funciona sem JavaScript e nao
 * arrasta os eventos para o bundle do cliente.
 */
export function Calendario({
  ano,
  mes,
  eventos,
  hoje,
}: {
  ano: number;
  mes: number;
  eventos: Evento[];
  hoje: Date;
}) {
  const primeiro = new Date(ano, mes - 1, 1);
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const vazios = primeiro.getDay();

  const porDia = new Map<number, Evento[]>();
  for (const e of eventos) {
    const d = diaDoMes(e.inicio);
    porDia.set(d, [...(porDia.get(d) ?? []), e]);
  }

  const ehMesDeHoje = hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes;
  const diaDeHoje = ehMesDeHoje ? hoje.getDate() : null;

  const anterior = mes === 1 ? chaveMes(ano - 1, 12) : chaveMes(ano, mes - 1);
  const proximo = mes === 12 ? chaveMes(ano + 1, 1) : chaveMes(ano, mes + 1);

  const rotuloMes = formatarData(`${chaveMes(ano, mes)}-01`, "MMMM 'de' yyyy");

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-texto first-letter:uppercase">{rotuloMes}</h3>
        <div className="flex items-center gap-1">
          <Link
            href={`/?mes=${anterior}#agenda`}
            scroll={false}
            aria-label="Mês anterior"
            className="grid h-9 w-9 place-items-center rounded-full border border-borda text-marca-700 transition-colors hover:border-marca-300 hover:bg-marca-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/?mes=${proximo}#agenda`}
            scroll={false}
            aria-label="Próximo mês"
            className="grid h-9 w-9 place-items-center rounded-full border border-borda text-marca-700 transition-colors hover:border-marca-300 hover:bg-marca-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="pb-2 text-xs font-medium uppercase tracking-wide text-texto-suave">
            {d}
          </div>
        ))}

        {Array.from({ length: vazios }, (_, i) => (
          <div key={`vazio-${i}`} />
        ))}

        {Array.from({ length: diasNoMes }, (_, i) => {
          const dia = i + 1;
          const doDia = porDia.get(dia) ?? [];
          const temEvento = doDia.length > 0;
          const eHoje = dia === diaDeHoje;

          return (
            <div
              key={dia}
              title={temEvento ? doDia.map((e) => e.titulo).join(" · ") : undefined}
              className={[
                "relative aspect-square rounded-xl text-sm transition-colors",
                "flex flex-col items-center justify-center gap-1",
                temEvento
                  ? "bg-marca-600 font-semibold text-white"
                  : eHoje
                    ? "bg-marca-100 font-semibold text-marca-800"
                    : "text-texto-suave",
                eHoje && temEvento ? "ring-2 ring-marca-300 ring-offset-2" : "",
              ].join(" ")}
            >
              {dia}
              {temEvento ? (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-white/70" />
              ) : null}
            </div>
          );
        })}
      </div>

      {eventos.length === 0 ? (
        <p className="mt-6 rounded-xl bg-marca-50 px-4 py-3 text-center text-sm text-texto-suave">
          Nenhuma atividade marcada para este mês.
        </p>
      ) : null}
    </div>
  );
}
