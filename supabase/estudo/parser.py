# -*- coding: utf-8 -*-
"""Extrai as questoes de O Livro dos Espiritos do texto do PDF."""
import io, re, json, sys
sys.stdout.reconfigure(encoding="utf-8")

def limpar(t):
    t = t.replace("­", "-").replace("͏", "").replace("‐", "-").replace("\x0c", " ")
    return re.sub(r"\s+", " ", t).strip()

bruto = io.open("lde.txt", encoding="utf-8").read()
linhas = bruto.split("\n")
inicio = next(i for i, l in enumerate(linhas) if l.strip() == "PARTE PRIMEIRA" and i > 200)

# O pdftotext gruda a proxima questao no fim da resposta anterior.
# Quebramos antes de "NNN. " quando vem depois de pontuacao de fim de frase.
QUEBRA = re.compile(r'(?<=[.”"!?\)A-ZÀ-Ú]) (?=\d{1,4}[a-c]?\.\s*[A-ZÀ-Ú“"])')

expandidas = []
for l in linhas[inicio:]:
    for pedaco in QUEBRA.split(l):
        expandidas.append(pedaco)

RE_QUESTAO = re.compile(r"^(\d{1,4})\s*([a-c])?\.\s*(.*)$")
RE_PARTE = re.compile(r"^PARTE (PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA)$")
RE_CAP = re.compile(r"^CAP[IÍ]TULO ([IVX]+)$")

parte_atual = capitulo_atual = item_atual = ""
questoes, atual = [], None
proximo = 1                      # numero esperado da proxima questao

i = 0
while i < len(expandidas):
    l = limpar(expandidas[i])

    m = RE_PARTE.match(l)
    if m:
        parte_atual = f"Parte {m.group(1).capitalize()} — {limpar(expandidas[i+1]).capitalize()}"
        capitulo_atual = item_atual = ""
        atual = None
        i += 2
        continue

    m = RE_CAP.match(l)
    if m:
        capitulo_atual = f"Capítulo {m.group(1)} — {limpar(expandidas[i+1]).capitalize()}"
        item_atual = ""
        atual = None
        i += 2
        continue

    if (l and len(l) < 90 and not RE_QUESTAO.match(l) and l == l.upper()
            and re.search(r"[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{3}", l)
            and "·" not in l and "LIVRO DOS ESP" not in l):
        item_atual = l.capitalize()
        atual = None
        i += 1
        continue

    m = RE_QUESTAO.match(l)
    if m:
        numero, sufixo = int(m.group(1)), (m.group(2) or "")
        # So aceita numeracao que avanca: descarta listas numeradas internas
        # (citacoes do Evangelho, classes de Espiritos) que reiniciam do 1.
        if sufixo and atual and numero == atual["numero"]:
            aceita = True
        else:
            aceita = proximo <= numero <= proximo + 3
        if aceita:
            atual = {"numero": numero, "sufixo": sufixo, "parte": parte_atual,
                     "capitulo": capitulo_atual, "item": item_atual, "texto": m.group(3)}
            questoes.append(atual)
            if not sufixo:
                proximo = numero + 1
            i += 1
            continue

    if atual and l and "LIVRO DOS ESP" not in l and not re.fullmatch(r"\d{1,3}", l):
        atual["texto"] += " " + l
    i += 1

saida = []
for q in questoes:
    t = limpar(q["texto"])
    t = re.sub(r"\(Vide[^)]*\)", "", t)
    t = re.sub(r"Nota Especial n[ºo°]?\s*\d+[^.]*\.", "", t)
    pos = t.find("“")
    pergunta, resposta = (t, "") if pos == -1 else (t[:pos].strip(), t[pos:].strip())
    pergunta = re.sub(r"\s*\d{1,2}\s*$", "", pergunta).strip()
    resposta = resposta.replace("“", '"').replace("”", '"').strip()
    resposta = re.sub(r'^"|"$', "", resposta).strip()
    saida.append({"numero": q["numero"], "sufixo": q["sufixo"], "parte": q["parte"],
                  "capitulo": q["capitulo"], "item": q["item"],
                  "pergunta": pergunta, "resposta": resposta})

io.open("questoes.json", "w", encoding="utf-8").write(json.dumps(saida, ensure_ascii=False, indent=1))

nums = [q["numero"] for q in saida if not q["sufixo"]]
print("total:", len(saida), "| principais:", len(nums), "| com sufixo:", len(saida) - len(nums))
print("duplicados:", len(nums) - len(set(nums)))
faltando = sorted(set(range(1, 1020)) - set(nums))
print("faltando:", len(faltando), faltando[:30])
print("sem resposta:", sum(1 for q in saida if not q["resposta"]))
print("pergunta vazia:", sum(1 for q in saida if not q["pergunta"]))
