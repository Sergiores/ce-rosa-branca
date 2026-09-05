# Importação de O Livro dos Espíritos

## O que tem aqui

| Arquivo | Conteúdo |
|---|---|
| `seed-questoes-01.sql` … `05.sql` | As **1.018 questões** extraídas da obra, como **rascunho** |
| `seed-pareceres-cap1.sql` | Pareceres das questões **2 a 16** (Capítulo I — De Deus), como rascunho |
| `parser.py`, `gerar_sql.py`, `pareceres_cap1.py` | Scripts que geraram os arquivos acima |

## Ordem de execução no SQL Editor

1. `../migrations/0007_questoes_status.sql` — cria o campo de status (se ainda não rodou)
2. `seed-questoes-01.sql` a `seed-questoes-05.sql`, nesta ordem
3. `seed-pareceres-cap1.sql`
4. `../seed-estudo.sql` — publica as questões 1 e 919 com os pareceres já revisados

Todos são idempotentes: rodar de novo atualiza, não duplica.

## Procedência do texto

Extraído do PDF de *O Livro dos Espíritos* (Allan Kardec, 1857), tradução de
**Guillon Ribeiro** — em domínio público no Brasil desde 2014, setenta anos após
a morte do tradutor (1943). Fonte do arquivo: biblioteca virtual de oconsolador.com.br.

## Limites conhecidos da extração

O texto veio de um PDF, então a conversão tem imperfeições. É por isso que tudo
entra como **rascunho**: nada aparece no site antes de alguém da casa ler e aprovar.

- **1.018 das 1.019 questões.** A de número **1011** não aparece numerada nesta
  edição — é apresentada como continuação da 1010, com travessão. O conteúdo dela
  está preservado dentro da resposta da 1010.
- **Sub-questões (`a)`, `b)`)** ficam dentro do campo *resposta*, junto da resposta
  principal. É fiel à obra, mas a formatação pode precisar de ajuste manual.
- **Itens expositivos** — a escala espírita (questões 100 a 113) e alguns trechos
  de observação — não são pergunta e resposta na obra. Neles, o título virou o
  enunciado e o texto foi para o campo de resposta.
- **Notas de rodapé e remissões** ("Vide nº 625") foram removidas automaticamente;
  pode ter sobrado ruído em alguns registros.

Ou seja: o conteúdo está correto no essencial, mas **cada questão deve ser lida
antes de publicar**. A busca por número na tela de gestão foi feita justamente
para tornar essa revisão prática.

## Sobre os pareceres

Foram escritos apenas para o Capítulo I. Os demais capítulos ficam com as questões
cadastradas e sem parecer — o parecer é a contribuição da casa sobre o texto, e faz
mais sentido que nasça do grupo de estudo do que de geração automática em massa.
