# Casa Espírita Rosa Branca

Site público e painel de gestão de uma casa espírita. Next.js 16 (App Router), TypeScript, Tailwind v4, Supabase, deploy na Vercel.

---

## NUNCA FAÇA — leia antes de qualquer outra coisa

Este app divide o banco com uma **loja em produção, com clientes pagantes**.
As quatro regras abaixo existem porque quebrá-las derruba a loja, não este site.

**1. Nunca execute nada de `supabase/` contra banco nenhum.**
Sem `supabase db push`, sem `supabase db reset`, sem colar `.sql` daqui no SQL
Editor. Todo arquivo daquela pasta escreve em `public`, que hoje é da loja. Um
deles cria um trigger sem filtro em `auth.users` que **aborta todo cadastro novo
da loja**. Detalhes em `supabase/LEIA-ME.md`.

**2. Nunca crie nem altere tabela, view, tipo, função, trigger ou policy.**
Nem por SQL, nem por CLI, nem pelo painel do Supabase. Mudança de estrutura sai
de `D:\Projetos\BancodeDados`, que é outro repositório e outro chat. Aqui só se
escreve código de aplicação.

**3. Nunca escreva em `public`.** É o schema da loja. `public.profiles` e
`rosabranca.profiles` são tabelas diferentes, com colunas diferentes.

**4. Nunca acrescente um novo uso de `criarClienteAdmin()`.**
Ela usa a service role, que ignora RLS **e alcança os dados da loja**, não só os
nossos. Isso foi verificado, não é hipótese. O único uso existente — o convite,
em `src/lib/gestao/acoes-usuarios.ts` — está auditado e basta. A signed URL de
anexo **não** usa a service role: sai por `criarClienteServidor()`, com RLS
aplicado. Precisando de um uso novo, pare e pergunte.

### Preciso de uma coluna nova. O que faço?

Pare e diga o que precisa. A migration é escrita e aplicada no outro repositório,
com os portões que já existem lá. Quando a coluna existir, reflita ela em
`src/lib/tipos.ts` à mão — não há types gerados — e siga usando `.from()` normal.

---

## O banco é compartilhado. Leia isto antes de mexer em dados.

Este projeto **não tem um banco só seu**. Ele vive dentro do projeto Supabase `ozlbqfvnsuupgmasdrrv`, que também atende outra aplicação, uma loja. A separação é por schema Postgres.

```
public.*        pertence à LOJA. Nunca escreva nada aqui.
rosabranca.*    as 20 tabelas deste projeto.
auth.users      COMPARTILHADO entre os dois apps.
storage.*       COMPARTILHADO entre os dois apps.
```

`public.profiles` e `rosabranca.profiles` existem as duas, com colunas diferentes. Não são a mesma tabela.

As migrations e a documentação do banco ficam em `D:\Projetos\BancodeDados`, não neste repositório.

### Tabelas e funções: não faça nada

Os clientes em `src/lib/supabase/` declaram `db: { schema: SCHEMA_DB }` na criação. Por isso `.from("noticias")` e `.rpc("lancar_documento")` já resolvem para o schema certo.

**Escreva como sempre.** Não qualifique, não chame `.schema()` à mão, não invente prefixo de tabela.

### Storage: sempre pelas constantes

`storage.buckets` é único no projeto, então os buckets deste app levam prefixo. Use as constantes de `src/lib/supabase/schema.ts`:

```ts
import { BUCKET_MIDIA, BUCKET_ANEXOS } from "@/lib/supabase/schema";

supabase.storage.from(BUCKET_MIDIA)   // rb-midia, público, imagens do site
supabase.storage.from(BUCKET_ANEXOS)  // rb-anexos, privado, notas e atas
```

Escrever `"midia"` ou `"anexos"` literal aponta para buckets que **pertencem a outro app**, ou que não existem. Isso não dá erro de compilação; falha só em produção.

### Auth: o convite precisa marcar o projeto

`auth.users` é a mesma tabela para os dois apps. Uma trigger cria o perfil aqui, e ela **só age quando o metadata diz que o usuário é deste projeto**:

```ts
admin.auth.admin.inviteUserByEmail(email, {
  data: { nome, projeto: SCHEMA_DB },  // sem isto, a conta nasce sem perfil
  redirectTo,
});
```

Sem o `projeto`, a conta é criada, o perfil não, e a pessoa não consegue entrar. Sem a trigger filtrar, todo cliente da loja ganharia perfil aqui.

Qualquer novo caminho de criação de usuário precisa passar esse metadata.

### Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=https://ozlbqfvnsuupgmasdrrv.supabase.co
```

Sem o sufixo `/rest/v1/`. O painel do Supabase exibe a URL com ele, porque ali é o endereço do endpoint REST, mas o SDK monta esse caminho sozinho. Copiar do painel direto para o `.env` é um erro fácil e já aconteceu aqui.

As mesmas três variáveis precisam estar na Vercel, em Settings > Environment Variables. O `.env.local` é só local e não sobe no deploy.

---

## Invariantes do domínio

Regras que estão no banco, não na interface. Quebrar qualquer uma delas gera erro em produção, não aviso no editor.

**A fronteira de segurança é o RLS, não a tela.** O middleware que protege `/gestao` é conveniência de navegação. Quem decide o que cada pessoa lê é a policy no Postgres. Não confie em esconder botão.

**A tabela `permissoes` dirige a UI e nada mais.** Ela diz quais telas aparecem para cada papel. Não substitui policy.

**`anon` só alcança as sete tabelas de conteúdo público:** notícias, páginas, eventos, projetos, mensagens do dia, pareceres e questões. As outras treze não têm grant nenhum para ele, e a leitura falha antes mesmo do RLS. Se uma tela pública precisar de dado novo, a policy e o grant precisam ser criados em `BancodeDados`, não contornados aqui.

**Conteúdo público só aparece publicado.** As policies filtram por `status = 'publicado'`. Rascunho é invisível para quem não é editor.

**Não existe coluna de saldo.** Saldo é `valor - soma(baixas)`, exposto pela view `v_titulos_saldo`. Nunca crie campo de saldo, nunca atualize total à mão.

**Baixas são append-only.** Um trigger recusa `update` e `delete`. Correção é lançamento de estorno, com valor negativo. Outro trigger recusa baixa acima do saldo devedor.

**Documento e duplicatas nascem juntos.** Use a RPC `lancar_documento`, que cria cabeçalho, itens e títulos na mesma transação. Nunca insira em `documentos` direto: geraria nota sem duplicata.

**Ata aprovada é somente leitura.** Corrigir exige reabrir para rascunho antes.

**Métricas gravam por RPC.** `registrar_acesso` e `registrar_visualizacao` são `security definer`. O anônimo não tem insert nessas tabelas, senão qualquer visitante inflaria o contador. Guardamos hash de sessão, nunca IP.

**Toda escrita é auditada.** Um trigger genérico registra em `rosabranca.auditoria`. Ao criar tabela nova, chame `rosabranca.aplicar_auditoria('nome_da_tabela')`.

**Anexos nunca são públicos.** O bucket é privado e o acesso sai por signed URL de curta duração, emitida no servidor.

---

## Convenções do código

- Nomes em português, inclusive funções e variáveis.
- `src/app/(site)/` é público, `src/app/(gestao)/` é restrito.
- Server Actions em `src/lib/gestao/acoes-*.ts`.
- `criarClienteAdmin()` ignora RLS. Hoje só o convite de usuário a usa. Nunca importe em componente cliente.
- Tipos escritos à mão em `src/lib/tipos.ts`. Não há types gerados do banco, então uma coluna nova precisa ser refletida ali manualmente.
- Listagens paginam com `.range()`. O limite de linhas por requisição da API é 1000.

## Resolvido (era pendência)

**Conta autenticada sem perfil aqui.** `auth.users` é compartilhado, então uma
conta da loja pode fazer login sem ter linha em `rosabranca.profiles`. Antes
isso virava laço entre `/entrar` e `/gestao`. Hoje `estadoSessao()` em
`src/lib/auth/permissoes.ts` distingue `anonimo`, `sem_perfil` e `inativo`, e
`exigirSessao()` manda os dois últimos para `/sem-acesso`, que explica a
situação e oferece logout. O middleware não mudou.

**Relatórios paginam.** `relatorios/page.tsx` varre `v_titulos_saldo` em blocos
de 1000 com `.range()`, em vez do antigo `.limit(2000)` que o teto da API
truncava em silêncio. Passando de 50 blocos a tela avisa que os totais estão
incompletos.
