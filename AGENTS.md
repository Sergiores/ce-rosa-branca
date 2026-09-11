# Casa Espírita Rosa Branca

Site público e painel de gestão de uma casa espírita. Next.js 16 (App Router), TypeScript, Tailwind v4, Supabase, deploy na Vercel.

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
- `criarClienteAdmin()` ignora RLS. Use apenas em servidor, para convite e signed URL. Nunca importe em componente cliente.
- Tipos escritos à mão em `src/lib/tipos.ts`. Não há types gerados do banco, então uma coluna nova precisa ser refletida ali manualmente.
- Listagens paginam com `.range()`. O limite de linhas por requisição da API é 1000.

## Pendência conhecida

`src/app/(gestao)/gestao/relatorios/page.tsx` pede `.limit(2000)` em `v_titulos_saldo`, mas o teto da API é 1000. Hoje não incomoda porque o volume é pequeno. Quando crescer, a tela vai truncar em silêncio e precisará paginar.
