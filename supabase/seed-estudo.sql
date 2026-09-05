-- ============================================================
-- Primeiras questoes do estudo de O Livro dos Espiritos.
--
-- Texto de Allan Kardec (1857) em traducao de dominio publico.
-- Os pareceres sao da casa e vao publicados.
--
-- Pode rodar mais de uma vez: atualiza em vez de duplicar.
-- ============================================================

-- ---------------------------------------------------------------- Questao 1
insert into public.questoes (numero, parte, capitulo, pergunta, resposta, status)
values (
  1,
  'Parte Primeira — Das Causas Primárias',
  'Capítulo I — De Deus',
  'O que é Deus?',
  'Deus é a inteligência suprema, causa primária de todas as coisas.',
  'publicado'
)
on conflict (numero) do update
  set parte = excluded.parte,
      capitulo = excluded.capitulo,
      pergunta = excluded.pergunta,
      resposta = excluded.resposta,
      status = excluded.status;

insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa',
$parecer1$A pergunta que abre a obra é a maior de todas, e a resposta cabe em uma linha. Essa desproporção não é falta de conteúdo: é a primeira lição do livro. Duas expressões carregam tudo.

"Inteligência suprema" não descreve um senhor sentado em um trono, vigiando quem erra. Diz que na origem de tudo existe ordem, propósito, pensamento — e não acaso puro. É a mesma constatação de quem olha o funcionamento de uma célula, o encaixe das órbitas ou o instinto de uma ave migratória e reconhece que ali há inteligência operando, mesmo sem conseguir dar nome a ela.

"Causa primária" é a expressão mais precisa do enunciado. Tudo o que existe tem uma causa anterior: você veio dos seus pais, eles dos seus, a Terra do Sol, o Sol de uma nuvem de gás. Puxando essa corrente para trás, ou ela é infinita — e então nada explica nada —, ou existe um ponto que não depende de nada anterior. A esse ponto a Doutrina chama Deus. Não é o primeiro elo da corrente: é aquilo que sustenta a corrente inteira.

Repare no que a resposta não faz. Não descreve aparência, não atribui humores, não exige adesão emocional, não ameaça. Kardec insiste no assunto nas questões seguintes e ouve, na questão 3, que qualquer definição maior seria incompleta pela pobreza da linguagem humana diante do que a ultrapassa. Ou seja: a resposta é curta porque é honesta. O Espiritismo prefere admitir o limite a preencher o vazio com invenção — e é esse mesmo rigor que ele pede de quem estuda.

Para a vida prática, o efeito dessa definição é silencioso e profundo. Quem entende Deus como inteligência e causa deixa de encarar a própria vida como uma sequência de acasos e passa a procurar sentido nos acontecimentos, inclusive nos dolorosos. Também deixa de tratar Deus como alguém a ser convencido por barganha ou por medo. Sobra algo mais sóbrio e mais firme: a confiança de que existe ordem por trás de tudo, mesmo quando não conseguimos enxergá-la de onde estamos.$parecer1$,
  'publicado'
from public.questoes q
where q.numero = 1
  and not exists (
    select 1 from public.pareceres p
    where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa'
  );

-- -------------------------------------------------------------- Questao 919
insert into public.questoes (numero, parte, capitulo, pergunta, resposta, status)
values (
  919,
  'Parte Terceira — Das Leis Morais',
  'Capítulo XII — Da Perfeição Moral',
  'Qual o meio prático mais eficaz que tem o homem de se melhorar nesta vida e de resistir ao arrastamento do mal?',
  'Um sábio da antiguidade vo-lo disse: "Conhece-te a ti mesmo."',
  'publicado'
)
on conflict (numero) do update
  set parte = excluded.parte,
      capitulo = excluded.capitulo,
      pergunta = excluded.pergunta,
      resposta = excluded.resposta,
      status = excluded.status;

insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa',
$parecer919$Esta é a pergunta mais prática do livro inteiro: não "o que devo acreditar", mas "o que eu faço, na segunda-feira de manhã, para melhorar de verdade". E a resposta surpreende. Não é rezar mais, não é frequentar mais, não é ler mais. É conhecer-se.

A escolha faz sentido quando se percebe que ninguém corrige aquilo que não enxerga. Todos nós temos uma versão de nós mesmos que apresentamos ao mundo — e uma segunda, que raramente olhamos de frente: a impaciência que justificamos como cansaço, a dureza que chamamos de sinceridade, o orgulho que apelidamos de dignidade. Enquanto o defeito permanece com nome trocado, ele não é combatido. Por isso o autoconhecimento vem antes da reforma: é ele que devolve o nome certo às coisas.

Na questão seguinte, ao ser perguntado como se chega a isso, o Espírito não responde com teoria. Descreve um hábito: ao fim do dia, passar em revista o que se fez, perguntando-se se faltou a algum dever e se alguém teve motivo para se queixar de nós. É um exame curto, diário e concreto — mais parecido com fechar o caixa do dia do que com um exercício místico.

O critério oferecido ali é o mais desconfortável e o mais eficaz: examinar o próprio ato como se outra pessoa o tivesse praticado. Somos indulgentes conosco e severos com os outros; inverter a régua desfaz quase toda desculpa que costumamos aceitar de nós mesmos. Vale também a pergunta seguinte, que dispensa comentário: se eu partisse hoje, haveria alguém cujo olhar eu não conseguiria encarar?

Uma advertência necessária: isto não é autoflagelo. Não se trata de terminar o dia catalogando culpas nem alimentando a sensação de nunca ser bom o bastante — isso paralisa, e o que paralisa não reforma ninguém. O exame proposto é sereno: reconhecer o que houve, entender o que ali precisa mudar e recomeçar amanhã. Quem faz isso por alguns meses percebe algo curioso: os erros começam a ser notados na hora em que acontecem, e não só à noite. É nesse ponto que a mudança deixa de ser intenção e vira caráter.

Cinco minutos no fim do dia. É todo o método que a resposta pede.$parecer919$,
  'publicado'
from public.questoes q
where q.numero = 919
  and not exists (
    select 1 from public.pareceres p
    where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa'
  );

-- Conferencia
select q.numero, q.capitulo, count(p.id) as pareceres_publicados
from public.questoes q
left join public.pareceres p on p.questao_id = q.id and p.status = 'publicado'
group by q.numero, q.capitulo
order by q.numero;
