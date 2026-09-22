import { AreaTexto, Campo, Rotulo, Selecao } from "@/components/ui";
import { FormularioSimples } from "@/components/gestao/Formulario";
import { SeletorPessoa, type PessoaVinculavel } from "@/components/gestao/SeletorPessoa";
import { salvarAluno, salvarAula, salvarTurma } from "@/lib/gestao/acoes-estudos";
import type { Aluno, Aula, Turma } from "@/lib/tipos";

/**
 * Os formulários de manutenção do estudo, fora das telas de consulta.
 * Cada um serve tanto o cadastro novo quanto a edição — o que muda é só o
 * `id` escondido e os valores iniciais.
 */

const DIAS = [
  { valor: "", rotulo: "—" },
  { valor: "0", rotulo: "Domingo" },
  { valor: "1", rotulo: "Segunda-feira" },
  { valor: "2", rotulo: "Terça-feira" },
  { valor: "3", rotulo: "Quarta-feira" },
  { valor: "4", rotulo: "Quinta-feira" },
  { valor: "5", rotulo: "Sexta-feira" },
  { valor: "6", rotulo: "Sábado" },
];

export function FormularioTurma({ turma }: { turma?: Turma | null }) {
  return (
    <FormularioSimples acao={salvarTurma} rotulo={turma ? "Salvar turma" : "Criar turma"}>
      <input type="hidden" name="id" value={turma?.id ?? ""} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Rotulo htmlFor="nome">Nome da turma</Rotulo>
          <Campo
            id="nome"
            name="nome"
            required
            defaultValue={turma?.nome ?? ""}
            placeholder="Ex.: Estudo do Evangelho — quartas"
          />
        </div>

        <div>
          <Rotulo htmlFor="nivel">Nível</Rotulo>
          <Campo
            id="nivel"
            name="nivel"
            required
            defaultValue={turma?.nivel ?? "Introdutório"}
            placeholder="Ex.: Introdutório, Aprofundamento"
          />
        </div>

        <div>
          <Rotulo htmlFor="status">Situação</Rotulo>
          <Selecao id="status" name="status" defaultValue={turma?.status ?? "planejada"}>
            <option value="planejada">Planejada</option>
            <option value="ativa">Em andamento</option>
            <option value="encerrada">Encerrada</option>
          </Selecao>
        </div>

        <div>
          <Rotulo htmlFor="dia_semana">Dia da semana</Rotulo>
          <Selecao
            id="dia_semana"
            name="dia_semana"
            defaultValue={turma?.dia_semana?.toString() ?? ""}
          >
            {DIAS.map((d) => (
              <option key={d.valor} value={d.valor}>
                {d.rotulo}
              </option>
            ))}
          </Selecao>
        </div>

        <div>
          <Rotulo htmlFor="horario">Horário</Rotulo>
          <Campo
            id="horario"
            name="horario"
            type="time"
            defaultValue={turma?.horario?.slice(0, 5) ?? ""}
          />
        </div>

        <div className="sm:col-span-2">
          <Rotulo htmlFor="local">Local</Rotulo>
          <Campo id="local" name="local" defaultValue={turma?.local ?? ""} />
        </div>

        <div>
          <Rotulo htmlFor="data_inicio">Início</Rotulo>
          <Campo
            id="data_inicio"
            name="data_inicio"
            type="date"
            defaultValue={turma?.data_inicio ?? ""}
          />
        </div>

        <div>
          <Rotulo htmlFor="data_fim">Término previsto</Rotulo>
          <Campo id="data_fim" name="data_fim" type="date" defaultValue={turma?.data_fim ?? ""} />
        </div>

        <div className="sm:col-span-2">
          <Rotulo htmlFor="descricao">Descrição</Rotulo>
          <AreaTexto id="descricao" name="descricao" rows={3} defaultValue={turma?.descricao ?? ""} />
        </div>
      </div>
    </FormularioSimples>
  );
}

export function FormularioAula({
  turmaId,
  aula,
  numeroSugerido,
}: {
  turmaId: string;
  aula?: Aula | null;
  numeroSugerido?: number;
}) {
  return (
    <FormularioSimples acao={salvarAula} rotulo={aula ? "Salvar aula" : "Criar aula"}>
      <input type="hidden" name="id" value={aula?.id ?? ""} />
      <input type="hidden" name="turma_id" value={turmaId} />

      {/* O aluno matriculado lê o plano e as observações na área dele.
          Anotação interna sobre aluno não deve entrar aqui. */}
      <p className="rounded-xl bg-marca-50 px-4 py-3 text-sm text-texto-suave">
        O planejamento e as observações aparecem para os alunos matriculados na área deles.
      </p>

      <div className="grid gap-5 sm:grid-cols-4">
        <div>
          <Rotulo htmlFor="numero">Nº</Rotulo>
          <Campo
            id="numero"
            name="numero"
            type="number"
            min={1}
            required
            defaultValue={aula?.numero ?? numeroSugerido ?? 1}
          />
        </div>

        <div className="sm:col-span-2">
          <Rotulo htmlFor="titulo">Título</Rotulo>
          <Campo
            id="titulo"
            name="titulo"
            required
            defaultValue={aula?.titulo ?? ""}
            placeholder="Ex.: A prece segundo o Espiritismo"
          />
        </div>

        <div>
          <Rotulo htmlFor="data">Data</Rotulo>
          <Campo id="data" name="data" type="date" required defaultValue={aula?.data ?? ""} />
        </div>

        <div className="sm:col-span-4">
          <Rotulo htmlFor="plano">Planejamento da aula</Rotulo>
          <AreaTexto
            id="plano"
            name="plano"
            rows={8}
            defaultValue={aula?.plano ?? ""}
            placeholder="Objetivo do encontro, roteiro, textos de apoio, dinâmica..."
          />
        </div>

        <div>
          <Rotulo htmlFor="status">Situação</Rotulo>
          <Selecao id="status" name="status" defaultValue={aula?.status ?? "planejada"}>
            <option value="planejada">Planejada</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </Selecao>
        </div>

        <div className="sm:col-span-3">
          <Rotulo htmlFor="observacoes">Observações</Rotulo>
          <Campo id="observacoes" name="observacoes" defaultValue={aula?.observacoes ?? ""} />
        </div>
      </div>
    </FormularioSimples>
  );
}

export function FormularioAluno({
  aluno,
  pessoas,
}: {
  aluno?: Aluno | null;
  pessoas?: PessoaVinculavel[];
}) {
  return (
    <FormularioSimples acao={salvarAluno} rotulo={aluno ? "Salvar dados" : "Cadastrar aluno"}>
      <input type="hidden" name="id" value={aluno?.id ?? ""} />
      {aluno ? null : <input type="hidden" name="ativo" value="1" />}

      {/* O vínculo com a conta só entra no cadastro novo: trocar a conta de
          um aluno existente desfaria o acesso que ele já tem. */}
      {aluno ? null : <SeletorPessoa pessoas={pessoas ?? []} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Rotulo htmlFor="nome">Nome</Rotulo>
          <Campo id="nome" name="nome" required defaultValue={aluno?.nome ?? ""} />
        </div>
        <div>
          <Rotulo htmlFor="email">E-mail</Rotulo>
          <Campo id="email" name="email" type="email" defaultValue={aluno?.email ?? ""} />
        </div>
        <div>
          <Rotulo htmlFor="telefone">Telefone</Rotulo>
          <Campo id="telefone" name="telefone" defaultValue={aluno?.telefone ?? ""} />
        </div>
        {aluno ? (
          <div>
            <Rotulo htmlFor="ativo">Situação</Rotulo>
            <Selecao id="ativo" name="ativo" defaultValue={aluno.ativo ? "1" : "0"}>
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </Selecao>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Rotulo htmlFor="observacoes">Observações</Rotulo>
          <AreaTexto
            id="observacoes"
            name="observacoes"
            rows={3}
            defaultValue={aluno?.observacoes ?? ""}
          />
        </div>
      </div>
    </FormularioSimples>
  );
}
