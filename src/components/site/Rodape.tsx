import Link from "next/link";

export function Rodape({ lojaUrl }: { lojaUrl?: string }) {
  const ano = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-borda bg-white">
      <div className="container-site grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-marca-600 text-sm font-semibold text-white">
              RB
            </span>
            <span className="text-sm font-semibold text-texto">Casa Espírita Rosa Branca</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-texto-suave">
            Casa de estudo, oração e trabalho, aberta a todos que buscam consolo e esclarecimento à
            luz da doutrina espírita.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-texto">Navegação</h4>
          <ul className="mt-4 space-y-2 text-sm text-texto-suave">
            <li><Link className="hover:text-marca-700" href="/noticias">Notícias</Link></li>
            <li><Link className="hover:text-marca-700" href="/eventos">Eventos</Link></li>
            <li><Link className="hover:text-marca-700" href="/projetos">Projetos</Link></li>
            <li><Link className="hover:text-marca-700" href="/estudo">Livro dos Espíritos</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-texto">Institucional</h4>
          <ul className="mt-4 space-y-2 text-sm text-texto-suave">
            <li><Link className="hover:text-marca-700" href="/sobre">A Casa</Link></li>
            <li><Link className="hover:text-marca-700" href="/sobre/missao">Missão e valores</Link></li>
            <li><Link className="hover:text-marca-700" href="/contato">Contato</Link></li>
            <li><Link className="hover:text-marca-700" href="/entrar">Área restrita</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-texto">Loja</h4>
          <p className="mt-4 text-sm text-texto-suave">
            Livros e materiais de estudo para apoiar as atividades da casa.
          </p>
          {lojaUrl ? (
            <a
              href={lojaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex rounded-full bg-marca-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-marca-700"
            >
              Visitar a loja
            </a>
          ) : null}
        </div>
      </div>

      <div className="border-t border-borda">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-texto-suave sm:flex-row sm:items-center sm:justify-between">
          <p>© {ano} Casa Espírita Rosa Branca. Todos os direitos reservados.</p>
          <p>Feito com dedicação ao trabalho voluntário.</p>
        </div>
      </div>
    </footer>
  );
}
