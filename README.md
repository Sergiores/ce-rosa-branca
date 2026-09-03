# Casa Espírita Rosa Branca

Site público e sistema de gestão da Casa Espírita Rosa Branca.

- **Site**: home com carrossel de notícias, mensagem do dia, eventos e calendário, projetos,
  estudo do *Livro dos Médiuns*, páginas institucionais, contato e botão para a loja externa.
- **Gestão**: usuários por perfil com permissão por tela, conteúdo do site, atas de reunião,
  membros e mensalidades, documentos de compra/venda, contas a pagar e a receber com duplicatas
  e baixas, relatórios, auditoria e audiência do site.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres, Auth, Storage) · Vercel.

---

## Princípios que valem para qualquer alteração futura

1. **A permissão real é o RLS do Postgres, não a interface.** O navegador carrega a chave anônima
   e pode consultar tabelas direto. Esconder um item de menu não protege dado nenhum.
   A tabela `permissoes` molda a UI; as policies protegem as linhas.
2. **Não existe coluna de saldo.** `saldo = valor − SUM(baixas)`, exposto por `v_titulos_saldo`.
   Baixas são *append-only*: correção é um estorno (valor negativo), nunca edição.
3. **Auditoria é responsabilidade do banco.** A trigger `fn_auditoria()` registra tudo — inclusive
   alteração feita direto pelo painel do Supabase. Toda tabela nova deve chamar
   `select public.aplicar_auditoria('<tabela>')`.
4. **Contadores não são incrementados pelo cliente.** Acesso e visualização passam por RPC
   `SECURITY DEFINER`; o anônimo não tem `insert` nessas tabelas.
5. **LGPD.** Vínculo com casa espírita é dado sensível. Membros e mensalidades ficam atrás de RLS;
   métricas guardam apenas hash de sessão, nunca IP.

---

## Configuração

### 1. Projeto Supabase

Crie o projeto em [supabase.com](https://supabase.com) e aplique as migrations **em ordem**,
pelo SQL Editor:

```
supabase/migrations/0001_base.sql
supabase/migrations/0002_conteudo.sql
supabase/migrations/0003_metricas.sql
supabase/migrations/0004_anexos.sql
supabase/migrations/0005_atas.sql
supabase/migrations/0006_financeiro.sql
```

Depois, no painel do Supabase:

- **Authentication → Providers → Email**: desligue *Enable signups* (o acesso é só por convite).
- **Authentication → URL Configuration**: aponte *Site URL* e *Redirect URLs* para a URL do deploy
  (`https://<projeto>.vercel.app`) e para `http://localhost:3000` em desenvolvimento.
  **Atualize isto quando o domínio próprio entrar no ar**, ou o login quebra sem aviso claro.
- **Storage**: os buckets `midia` (público) e `anexos` (privado) já são criados pela migration 0004.

### 2. Primeiro usuário da diretoria

Crie o usuário em *Authentication → Users → Add user* e depois promova-o pelo SQL Editor:

```sql
update public.profiles set role = 'diretoria', ativo = true
where email = 'email-da-diretoria@exemplo.com';
```

A partir daí os demais acessos são criados pela tela **Gestão → Usuários**.

### 3. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

| Variável | Para que serve |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Acesso do app ao Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Só no servidor, para convidar usuários. Nunca expor |
| `METRICAS_SALT` | Sal do hash de sessão das métricas |
| `NEXT_PUBLIC_SITE_URL` | Base das URLs e do link de convite |
| `NEXT_PUBLIC_LOJA_URL` | Destino do botão "Loja" |
| `NEXT_PUBLIC_PIX_CHAVE` / `_NOME` / `_CIDADE` | Cobrança Pix estática nas mensalidades |

### 4. Rodar

```bash
npm install && npm run dev
```

### 5. Deploy na Vercel

Importe o repositório, cadastre as mesmas variáveis de ambiente e faça o deploy.
Ao registrar o domínio próprio, atualize `NEXT_PUBLIC_SITE_URL` e as URLs de Auth no Supabase.

---

## Verificação

### Segurança — o passo que costuma ser pulado

Entre como um usuário `membro` e consulte as tabelas **direto no Supabase** (não pelo app):

```sql
select * from titulos;    -- deve voltar 0 linhas (exceto os proprios titulos a receber)
select * from membros;    -- 0 linhas
select * from documentos; -- 0 linhas
select * from atas;       -- 0 linhas
select * from auditoria;  -- 0 linhas
```

Zero linhas é o resultado correto — um 403 vindo do Next.js **não** prova nada.
Repita para `voluntario` e `aluno`. Com a chave anônima, `select * from noticias` deve trazer
apenas as publicadas.

### Financeiro

- Nota a prazo em 3 parcelas → exatamente 3 títulos, soma igual ao total da nota.
- Baixa parcial → saldo correto, situação `parcial`; baixa complementar → `pago`, saldo zero.
- Estorno → saldo volta ao valor anterior e o histórico continua visível.
- Tentar baixar mais que o saldo → erro vindo do banco.
- Rodar a geração de mensalidades duas vezes na mesma competência → nenhuma duplicata.

### Auditoria, anexos e métricas

- Criar, editar e excluir uma notícia, um título e uma ata → registros em *Gestão → Auditoria*.
- Alterar um registro direto pelo painel do Supabase → também aparece na auditoria.
- Anexo: URL direta do Storage sem assinatura → 403; pelo botão de download → abre.
- Abrir a home e uma notícia → contadores sobem em *Gestão → Audiência*; recarregar na mesma
  sessão não conta de novo.
