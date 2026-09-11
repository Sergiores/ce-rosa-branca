# Nada nesta pasta pode ser executado contra banco nenhum

Leia isto inteiro antes de abrir qualquer `.sql` daqui.

## O que mudou

Este projeto deixou de ter um banco Supabase só seu. Ele passou a viver dentro do
projeto `ozlbqfvnsuupgmasdrrv`, no schema `rosabranca`. Esse mesmo projeto atende
uma **loja em produção, com clientes pagantes**, e a loja é dona do schema `public`.

Todo `.sql` desta pasta foi escrito antes disso, quando `public` era nosso.
Hoje `public` é da loja. Os arquivos continuam aqui só como histórico.

## Por que executar qualquer um deles quebra a loja

`_historico-pre-consolidacao/migrations/0001_base.sql` cria um trigger
`trg_novo_usuario` em `auth.users` **sem nenhum filtro**, e a função dele insere
em `public.profiles` com as colunas `(id, nome, email, role)`.

`auth.users` é único no projeto inteiro: é a mesma tabela para nós e para a loja.
`public.profiles` é a tabela da loja, com outras colunas.

Resultado se esse arquivo rodar: todo cadastro novo da loja dispara um insert que
falha, dentro de um trigger `after insert`, o que **aborta o cadastro**. A loja
para de aceitar clientes novos, em silêncio, para todo mundo.

`0004_anexos.sql` é o segundo pior: tem `drop policy if exists midia_leitura on
storage.objects` e um `on conflict (id) do update set public = true` em
`storage.buckets`. As duas tabelas também são únicas no projeto. Isso apaga
policy da loja e pode tornar público um bucket privado dela.

`schema-completo.sql` contém tudo isso junto, num arquivo feito para ser colado
de uma vez no SQL Editor. É o arquivo mais perigoso do repositório.

## Onde o schema vive agora

```
D:\Projetos\BancodeDados
```

Lá estão as migrations convertidas para o schema `rosabranca`, o roteiro do que
foi feito (`EXECUTAR.md`) e a documentação. É o único lugar de onde sai mudança
de banco.

## Preciso de uma tabela ou coluna nova. E agora?

Não escreva SQL aqui. Peça a mudança no repositório `BancodeDados`, dizendo o que
precisa. De lá sai uma migration numerada na faixa `011x`, aplicada com os
portões de segurança que já existem (RLS obrigatório, grants derivados das
policies, nomes de policy e bucket prefixados).

Depois que a tabela existir, o código deste repositório usa ela normalmente:
`.from("nome_da_tabela")` já resolve para `rosabranca`, porque o schema está
declarado na criação do cliente em `src/lib/supabase/`.

## O que ainda é seguro ler daqui

- `estudo/` — seeds das 1018 questões. São dados, não estrutura. Já foram
  carregados e migrados. Servem de referência, não devem ser rodados de novo.
- `_historico-pre-consolidacao/` — leitura para entender como uma tabela foi
  criada. Nunca execução.
