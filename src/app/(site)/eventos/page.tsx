import type { Metadata } from "next";
import { CalendarDays, MapPin } from "lucide-react";
import { Cartao, CartaoCorpo, Etiqueta, TituloSecao, Vazio } from "@/components/ui";
import { formatarData, formatarDataLonga } from "@/lib/datas";
import { listarEventos } from "@/lib/conteudo";
import { registrarAcesso } from "@/lib/metricas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Eventos e calendário" };

export default async function PaginaEventos() {
  await registrarAcesso("/eventos");
  const eventos = await listarEventos();

  const agora = Date.now();
  const proximos = eventos.filter((e) => new Date(e.inicio).getTime() >= agora);
  const passados = eventos
    .filter((e) => new Date(e.inicio).getTime() < agora)
    .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());

  // Agrupa os proximos por mes para funcionar como calendario simples.
  const porMes = new Map<string, typeof proximos>();
  for (const e of proximos) {
    const chave = formatarData(e.inicio, "MMMM 'de' yyyy");
    porMes.set(chave, [...(porMes.get(chave) ?? []), e]);
  }

  return (
    <div className="container-site py-14">
      <TituloSecao
        titulo="Eventos e calendário"
        descricao="Palestras, cursos, estudos e atividades abertas à comunidade."
      />

      {proximos.length === 0 ? (
        <Vazio mensagem="Nenhum evento agendado no momento." />
      ) : (
        <div className="space-y-12">
          {[...porMes.entries()].map(([mes, lista]) => (
            <section key={mes}>
              <h2 className="mb-5 text-lg font-semibold text-marca-700 first-letter:uppercase">{mes}</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {lista.map((e) => (
                  <Cartao key={e.id} className="h-full overflow-hidden">
                    {e.imagem_url ? (
                      <div
                        className="h-36 bg-marca-100 bg-cover bg-center"
                        style={{ backgroundImage: `url(${e.imagem_url})` }}
                      />
                    ) : null}
                    <CartaoCorpo>
                      <div className="flex items-center gap-2 text-marca-600">
                        <CalendarDays className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {formatarData(e.inicio, "dd/MM 'às' HH:mm")}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-texto">{e.titulo}</h3>
                      {e.local ? (
                        <p className="mt-1 flex items-center gap-1 text-sm text-texto-suave">
                          <MapPin className="h-3.5 w-3.5" /> {e.local}
                        </p>
                      ) : null}
                      {e.descricao ? (
                        <p className="mt-3 text-sm leading-relaxed text-texto-suave">{e.descricao}</p>
                      ) : null}
                    </CartaoCorpo>
                  </Cartao>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {passados.length > 0 ? (
        <section className="mt-16">
          <h2 className="mb-5 text-lg font-semibold text-texto-suave">Já aconteceram</h2>
          <ul className="divide-y divide-borda rounded-2xl border border-borda bg-white">
            {passados.slice(0, 12).map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <span className="text-sm font-medium text-texto">{e.titulo}</span>
                <Etiqueta tom="cinza">{formatarDataLonga(e.inicio)}</Etiqueta>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
