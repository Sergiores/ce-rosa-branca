export type Papel = "diretoria" | "voluntario" | "aluno" | "membro";
export type StatusPublicacao = "rascunho" | "publicado";
export type StatusTitulo = "aberto" | "parcial" | "vencido" | "pago" | "cancelado";
export type TipoTitulo = "pagar" | "receber";
export type TipoMovimento = "entrada" | "saida";
export type CondicaoPagamento = "avista" | "prazo";
export type TipoReuniao = "ordinaria" | "extraordinaria" | "assembleia";
export type EntidadeMetrica = "noticia" | "mensagem" | "pagina" | "evento" | "projeto";
export type EntidadeAnexo = "documento" | "ata" | "noticia" | "evento";

export type Perfil = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  role: Papel;
  ativo: boolean;
};

export type Noticia = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  corpo: string;
  imagem_url: string | null;
  status: StatusPublicacao;
  destaque_carrossel: boolean;
  publicado_em: string | null;
  autor_id: string | null;
  criado_em: string;
};

export type Evento = {
  id: string;
  titulo: string;
  descricao: string | null;
  inicio: string;
  fim: string | null;
  local: string | null;
  imagem_url: string | null;
  status: StatusPublicacao;
};

export type Projeto = {
  id: string;
  titulo: string;
  descricao: string | null;
  imagem_url: string | null;
  ordem: number;
  status: StatusPublicacao;
};

export type MensagemDoDia = {
  id: string;
  data: string;
  texto: string;
  autor: string | null;
  status: StatusPublicacao;
};

export type Pagina = {
  slug: string;
  titulo: string;
  corpo: string;
  status: StatusPublicacao;
};

export type Questao = {
  id: string;
  numero: number;
  parte: string | null;
  capitulo: string | null;
  pergunta: string;
  resposta: string;
};

export type Parecer = {
  id: string;
  questao_id: string;
  autor_nome: string | null;
  texto: string;
  status: StatusPublicacao;
};

export type Ata = {
  id: string;
  numero: number;
  ano: number;
  data_reuniao: string;
  tipo: TipoReuniao;
  titulo: string;
  pauta: string | null;
  deliberacoes: string | null;
  participantes: string | null;
  status: "rascunho" | "aprovada";
  visivel_voluntarios: boolean;
  aprovada_em: string | null;
};

export type Membro = {
  id: string;
  profile_id: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  data_ingresso: string | null;
  categoria: string | null;
  ativo: boolean;
};

export type TituloComSaldo = {
  id: string;
  tipo: TipoTitulo;
  documento_id: string | null;
  membro_id: string | null;
  competencia: string | null;
  descricao: string;
  parcela: number;
  total_parcelas: number;
  vencimento: string;
  valor: number;
  cancelado: boolean;
  valor_pago: number;
  saldo: number;
  status: StatusTitulo;
  fornecedor_cliente: string | null;
  documento_numero: string | null;
  membro_nome: string | null;
  criado_em: string;
};

export type Baixa = {
  id: string;
  titulo_id: string;
  data: string;
  valor: number;
  forma: string;
  observacao: string | null;
};

export type Anexo = {
  id: string;
  entidade: EntidadeAnexo;
  entidade_id: string;
  nome_arquivo: string;
  mime: string;
  tamanho: number;
  storage_path: string;
  criado_em: string;
};

export type RegistroAuditoria = {
  id: number;
  tabela: string;
  registro_id: string | null;
  acao: "INSERT" | "UPDATE" | "DELETE";
  autor_id: string | null;
  autor_email: string | null;
  dados_antes: Record<string, unknown> | null;
  dados_depois: Record<string, unknown> | null;
  criado_em: string;
};
