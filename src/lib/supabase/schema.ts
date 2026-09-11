/**
 * Schema Postgres deste projeto dentro do banco consolidado.
 *
 * O banco e compartilhado com outros projetos: cada um vive no proprio
 * schema, e o `public` pertence a outra aplicacao. Declarar o schema na
 * criacao do cliente e o que permite que todas as chamadas `.from()` e
 * `.rpc()` do codigo continuem escritas sem qualificacao.
 *
 * Vale para a Data API (tabelas, views, funcoes). NAO vale para `auth`
 * nem para `storage`, que sao compartilhados: por isso os buckets levam
 * o prefixo abaixo, e o convite de usuario marca o projeto no metadata.
 */
export const SCHEMA_DB = "rosabranca";

/** Prefixo dos buckets deste projeto em storage.buckets, que e unico no banco. */
export const BUCKET_MIDIA = "rb-midia";
export const BUCKET_ANEXOS = "rb-anexos";
