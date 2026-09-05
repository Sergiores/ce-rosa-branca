-- ============================================================
-- Pareceres do Capitulo I (De Deus) — questoes 2 a 16.
-- Entram como RASCUNHO, para revisao antes de publicar.
-- Nao duplica: so insere se ainda nao houver parecer deste autor.
-- ============================================================

-- questao 2
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p2$Kardec pergunta pelo infinito logo depois de perguntar por Deus, e a resposta define pelo que falta: aquilo que não tem começo nem fim, o desconhecido.

É uma definição negativa de propósito. Nossa mente foi treinada para trabalhar com limites — tudo o que conhecemos começa, dura e termina. Diante do que não tem borda, a razão não consegue fechar o contorno; consegue apenas apontar. A resposta faz exatamente isso: aponta e para.

Vale reparar na frase final: "tudo o que é desconhecido é infinito". Ela desloca o infinito do céu para a nossa mesa. Aquilo que ainda não compreendemos — de um sofrimento sem explicação até o funcionamento da própria consciência — funciona, para nós, como um infinito: não podemos medir a extensão do que ignoramos. Isso convida à humildade intelectual, que é o oposto tanto do fanatismo quanto do ceticismo fechado.$p2$, 'rascunho'
from public.questoes q
where q.numero = 2
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 3
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p3$Kardec insiste: se Deus é sem começo nem fim, não bastaria dizer que Deus é o infinito? A resposta recusa a facilidade — "definição incompleta".

O motivo é preciso. Infinito é uma qualidade, não um ser. Dizer que Deus é o infinito é como dizer que uma pessoa é a altura dela: descreve uma dimensão e perde o resto. Deus é infinito em suas perfeições, mas não se reduz a nenhuma delas.

E vem a frase mais importante do trecho: a "pobreza da linguagem humana". Nossas palavras nasceram para nomear o que cabe na experiência — coisas que se veem, se contam, se comparam. Aplicá-las ao que ultrapassa a experiência é usar uma régua curta demais. Reconhecer isso não é desistir de pensar; é saber que toda formulação nossa sobre Deus será aproximação, e que quem afirma ter a definição exata está, quase sempre, dizendo mais sobre si do que sobre Deus.$p3$, 'rascunho'
from public.questoes q
where q.numero = 3
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 4
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p4$Aqui a Doutrina mostra o método que a caracteriza. Perguntado pela prova da existência de Deus, o Espírito não apela a revelação, tradição ou autoridade. Apela a um princípio que o interlocutor já aceita: não há efeito sem causa.

O raciocínio é honesto e verificável. Olhe ao redor e separe o que é obra humana do que não é. Do que não é, procure a causa. Cada causa encontrada tem, por sua vez, outra atrás. O argumento não pede fé para funcionar — pede apenas que a pessoa leve o próprio raciocínio até o fim, sem parar no meio por conveniência.

É por isso que o Espiritismo se apresenta como doutrina de investigação, e não de submissão. A prova oferecida não é "creia porque foi dito", mas "raciocine e veja aonde chega". Quem estuda a casa deveria guardar esse critério: aqui não se pede que ninguém abandone a razão na porta de entrada.$p4$, 'rascunho'
from public.questoes q
where q.numero = 4
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 5
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p5$A questão trata do sentimento de Deus presente em quase todos os povos, e a resposta aplica ao sentimento o mesmo princípio usado para o mundo: se ele existe, tem uma base — não há efeito sem causa.

O argumento merece cuidado. Ele não afirma que a maioria decide a verdade; multidões já se enganaram sobre quase tudo. O que se afirma é mais estreito e mais forte: a universalidade de uma intuição pede explicação, e a explicação mais simples é que ela corresponde a algo real.

Na prática, isso valida uma experiência que muita gente tem e não sabe nomear — aquela sensação de que a vida não se esgota no que se vê. A Doutrina não manda tratá-la como fantasia nem como certeza automática. Manda examiná-la, como se examina qualquer indício sério.$p5$, 'rascunho'
from public.questoes q
where q.numero = 5
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 6
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p6$Kardec faz aqui o papel do bom cético: e se esse sentimento for apenas educação, ideia herdada, hábito cultural? A resposta é uma pergunta que devolve o problema — então por que ele aparece também entre povos que não receberam essa educação?

O ponto é metodológico. Se a ideia de Deus fosse ensinada por uma cultura específica, ela não deveria brotar onde essa cultura nunca chegou. Brotando em toda parte, e de formas independentes, ela se parece mais com algo que nasce do ser humano do que com algo que lhe foi colado por fora.

Note que Kardec não evitou a objeção mais incômoda ao que estava construindo — ele a colocou por escrito. Esse é o padrão da obra inteira: a dúvida entra no livro, não fica na porta. Um estudo que só reúne o que confirma a própria posição não está estudando; está se confortando.$p6$, 'rascunho'
from public.questoes q
where q.numero = 6
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 7
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p7$A objeção é séria e continua atual: e se a causa de tudo estiver nas propriedades da própria matéria, sem precisar de nada além dela?

A resposta não nega essas propriedades — devolve a pergunta um passo atrás: e qual é a causa dessas propriedades? Por que a matéria tem justamente estas, capazes de organizar mundos, e não outras, ou nenhuma? Atribuir tudo às propriedades da matéria não encerra a questão; apenas transfere o endereço dela.

É a mesma lógica da questão 4, aplicada com rigor. Explicar um efeito por outro efeito não é explicar. Em algum ponto a corrente precisa se apoiar em algo que não seja mais um elo — ou toda ela fica pendurada no nada.$p7$, 'rascunho'
from public.questoes q
where q.numero = 7
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 8
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p8$Aqui a Doutrina enfrenta o acaso, e a resposta é seca: "que é o acaso? Nada".

A observação é mais afiada do que parece. Acaso não é uma força, não é um agente, não faz nada — é o nome que damos à nossa ignorância sobre as causas. Quando dizemos "foi por acaso", geralmente estamos dizendo "não sei por quê". Usar esse nome como explicação da origem do Universo é dar a um vazio o papel de causa.

Isso não é um argumento contra a ciência, e sim contra o uso preguiçoso de uma palavra. A ciência não trabalha com acaso como agente: trabalha com leis, probabilidades e condições iniciais — que são, todas, coisas ordenadas, e portanto pedem explicação, não a dispensam.$p8$, 'rascunho'
from public.questoes q
where q.numero = 8
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 9
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p9$Perguntado onde se revela a inteligência na causa primária, o Espírito responde com um provérbio: pela obra se reconhece o autor. E acrescenta um diagnóstico incômodo — o orgulho é que gera a incredulidade.

A primeira parte é um convite à observação. Diante de qualquer coisa organizada, reconhecemos naturalmente o trabalho de uma inteligência; ninguém atribui um relógio ao acaso. A Doutrina apenas pede coerência: aplicar ao Universo o mesmo raciocínio que aplicamos a tudo o mais.

A segunda parte é a mais dura, e vale lê-la com cuidado para não virar acusação fácil. Não se diz que todo descrente é orgulhoso — muitos duvidam por sinceridade e por rigor. O que se aponta é uma tentação humana constante: a de recusar o que nos ultrapassa porque admiti-lo exige reconhecer que não somos a medida de todas as coisas. Essa tentação, aliás, também ronda o crente que julga ter Deus explicado.$p9$, 'rascunho'
from public.questoes q
where q.numero = 9
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 10
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p10$A resposta é de três palavras e desmonta séculos de disputa: não, falta-lhe o sentido.

A imagem é exata. Não enxergamos o infravermelho e não ouvimos o ultrassom — não porque essas coisas não existam, mas porque não temos o aparelho que as capta. Compreender a natureza íntima de Deus está, segundo a resposta, nessa mesma categoria: é uma limitação de instrumento, não uma prova de inexistência.

O efeito prático é saudável. Ele derruba a pretensão de qualquer pessoa, escola ou instituição de possuir a descrição definitiva de Deus. Se ninguém tem o sentido para isso, ninguém está autorizado a falar como quem viu. Resta o que a obra propõe: reconhecer os efeitos, respeitar o limite e desconfiar de quem promete mais.$p10$, 'rascunho'
from public.questoes q
where q.numero = 10
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 11
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p11$À pergunta se algum dia compreenderemos, a resposta não é "nunca" — é "quando não mais tiver o espírito obscurecido pela matéria".

A diferença é decisiva. O limite da questão anterior não é um muro permanente: é a condição de quem ainda está em determinado estágio. O acesso não vem por estudo acumulado nem por revelação súbita, mas por transformação de quem olha — pela aproximação moral, diz o texto.

Isso reorganiza a ideia de progresso. O caminho até a compreensão das coisas maiores não passa por acumular informação, e sim por depurar quem somos. É por essa razão que uma doutrina que começa discutindo a causa primária termina, seiscentas páginas adiante, falando de caridade e de autoconhecimento. Não é mudança de assunto: é o mesmo assunto.$p11$, 'rascunho'
from public.questoes q
where q.numero = 11
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 12
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p12$Aqui a obra abre uma porta que as duas questões anteriores pareciam fechar. Não podemos compreender a natureza íntima de Deus, mas podemos formar ideia de algumas de suas perfeições — e as compreendemos melhor à medida que nos elevamos acima da matéria.

A imagem é a de quem sobe uma encosta: o terreno é o mesmo, mas o que se enxerga muda com a altura. Não se trata de ficar mais inteligente, e sim de ficar menos preso ao imediato — ao que se possui, ao que se aparenta, ao que se teme perder.

Vale reter o verbo escolhido: "entrevê". Não se promete visão clara, e sim vislumbre. É pouco, mas é honesto — e é bem mais do que promete quem afirma ter Deus todo explicado.$p12$, 'rascunho'
from public.questoes q
where q.numero = 12
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 13
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p13$Kardec lista os atributos costumeiros — eterno, infinito, imutável, imaterial, único, onipotente, justo e bom — e pergunta se com isso já se tem a ideia completa. A resposta concede pela metade: do ponto de vista de vocês, sim, porque creem abranger tudo.

Há uma advertência delicada nesse "porque credes". Os atributos não estão errados; o erro está em tomá-los como um retrato completo. São aproximações que a linguagem permite, não as medidas exatas do objeto.

Por isso a lista merece ser lida com atenção também no que ela recusa. Nenhum dos atributos é caprichoso, vingativo ou parcial. Justiça e bondade aparecem juntas, e isso tem consequência prática: uma ideia de Deus que precise de medo para funcionar já não corresponde à definição que a própria obra apresenta.$p13$, 'rascunho'
from public.questoes q
where q.numero = 13
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 14
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p14$A pergunta é se Deus é um ser distinto ou a soma de todas as forças e inteligências do Universo. A resposta é lógica, não retórica: se fosse a soma, seria efeito, e não causa — e nada pode ser causa e efeito de si mesmo ao mesmo tempo.

O argumento retoma o fio de todo o capítulo. Uma resultante depende daquilo que a compõe; ela vem depois, não antes. Aquilo que explica a existência de tudo não pode ser um produto do que existe.

O ponto importa para o dia a dia mais do que parece. Se Deus fosse a soma de nós, não haveria referência fora de nós — o certo e o errado seriam apenas a média do que a humanidade pratica em cada época. É a distinção afirmada aqui que sustenta a ideia, desenvolvida no resto da obra, de uma lei moral que não depende do costume nem do voto da maioria.$p14$, 'rascunho'
from public.questoes q
where q.numero = 14
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 15
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p15$A questão trata do panteísmo — a ideia de que tudo o que existe seria parte de Deus. A resposta é uma frase curta e desconcertante: "não podendo fazer-se Deus, o homem quer ao menos ser uma parte de Deus".

O que se aponta aqui não é um erro de raciocínio, mas um movimento do coração. Há um consolo evidente em se pensar como fração da divindade: dissolve a distância, dispensa o esforço de melhorar, transforma o que já somos em algo automaticamente sagrado.

A objeção da Doutrina é sóbria. Se tudo é Deus, tudo é igualmente divino — inclusive a crueldade —, e a distinção entre progredir e estagnar desaparece. Somos, segundo a obra, criaturas em caminho, e não pedaços do Criador: é justamente essa distância que dá sentido ao esforço de percorrer o caminho.$p15$, 'rascunho'
from public.questoes q
where q.numero = 15
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

-- questao 16
insert into public.pareceres (questao_id, autor_nome, texto, status)
select q.id, 'Grupo de Estudo da Casa', $p16$O capítulo se encerra com Kardec apresentando o melhor argumento do lado oposto — se Deus é infinito, nada poderia existir fora dele, logo tudo seria Deus — e perguntando o que se lhe opõe. A resposta é de uma palavra: a razão.

Repare no que acontece nesse fecho. Depois de dezesseis questões sobre o assunto mais elevado possível, o critério final apresentado não é a autoridade dos Espíritos, nem a tradição, nem a fé. É o exame de quem lê. "Refleti maduramente", diz o texto — não "aceitai".

Esse é o resumo do capítulo e, de certo modo, da obra inteira. Uma doutrina que abre pedindo raciocínio, e não obediência, estabelece desde a primeira página o tipo de adesão que deseja: a de quem entendeu, não a de quem se rendeu.$p16$, 'rascunho'
from public.questoes q
where q.numero = 16
  and not exists (select 1 from public.pareceres p
                  where p.questao_id = q.id and p.autor_nome = 'Grupo de Estudo da Casa');

select q.numero, count(p.id) as pareceres
from public.questoes q
join public.pareceres p on p.questao_id = q.id
where q.numero <= 16
group by q.numero order by q.numero;
