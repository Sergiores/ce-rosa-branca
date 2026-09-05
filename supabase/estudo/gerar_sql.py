# -*- coding: utf-8 -*-
"""Gera os arquivos SQL de importacao das questoes, em lotes."""
import io, json, re, sys, os
sys.stdout.reconfigure(encoding="utf-8")

qs = json.load(io.open("questoes.json", encoding="utf-8"))

PROPRIOS = {
    "deus": "Deus", "espirito": "Espírito", "espirito?": "Espírito",
    "espiritos": "Espíritos", "espirita": "Espírita", "terra": "Terra",
    "cristo": "Cristo", "jesus": "Jesus", "universo": "Universo",
    "criacao": "Criação", "adao": "Adão", "biblia": "Bíblia",
}

def sem_acento(p):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", p.lower())
                   if unicodedata.category(c) != "Mn")

def titulo_bonito(t):
    """Capitaliza como frase, devolvendo maiuscula aos nomes proprios."""
    t = t.strip().rstrip(",;")
    if not t:
        return t
    partes = t.split(" — ", 1)
    corpo = partes[-1]
    palavras = corpo.split()
    saida = []
    for i, p in enumerate(palavras):
        chave = sem_acento(re.sub(r"[^\wÀ-ÿ]", "", p))
        if chave in PROPRIOS:
            saida.append(PROPRIOS[chave] + re.sub(r"^[\wÀ-ÿ]+", "", p))
        elif i == 0:
            saida.append(p[0].upper() + p[1:].lower())
        else:
            saida.append(p.lower())
    corpo = " ".join(saida)
    return (partes[0] + " — " + corpo) if len(partes) == 2 else corpo

def limpar_texto(t):
    t = re.sub(r"\s*\d{1,2}\s*,?\s*última página deste livro\)\.?", "", t)
    t = re.sub(r"\(?\s*Vide[^)]*\)?", "", t)
    t = re.sub(r"\(\s*\d{1,4}\s*\)", "", t)          # remissoes soltas "(643)"
    t = t.replace(" ,", ",").replace(" .", ".")
    t = re.sub(r'^\s*"\s*|\s*"\s*$', "", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def esc(t):
    return t.replace("'", "''")


# Titulos oficiais dos capitulos: o PDF trunca alguns na quebra de linha.
TITULOS = {
 ("Parte Primeira","I"): "De Deus",
 ("Parte Primeira","II"): "Dos elementos gerais do Universo",
 ("Parte Primeira","III"): "Da Criação",
 ("Parte Primeira","IV"): "Do princípio vital",
 ("Parte Segunda","I"): "Dos Espíritos",
 ("Parte Segunda","II"): "Da encarnação dos Espíritos",
 ("Parte Segunda","III"): "Da volta do Espírito, extinta a vida corpórea, à vida espiritual",
 ("Parte Segunda","IV"): "Da pluralidade das existências",
 ("Parte Segunda","V"): "Considerações sobre a pluralidade das existências",
 ("Parte Segunda","VI"): "Da vida espírita",
 ("Parte Segunda","VII"): "Da volta do Espírito à vida corporal",
 ("Parte Segunda","VIII"): "Da emancipação da alma",
 ("Parte Segunda","IX"): "Da intervenção dos Espíritos no mundo corporal",
 ("Parte Segunda","X"): "Das ocupações e missões dos Espíritos",
 ("Parte Segunda","XI"): "Dos três reinos",
 ("Parte Terceira","I"): "Da lei divina ou natural",
 ("Parte Terceira","II"): "Da lei de adoração",
 ("Parte Terceira","III"): "Da lei do trabalho",
 ("Parte Terceira","IV"): "Da lei de reprodução",
 ("Parte Terceira","V"): "Da lei de conservação",
 ("Parte Terceira","VI"): "Da lei de destruição",
 ("Parte Terceira","VII"): "Da lei de sociedade",
 ("Parte Terceira","VIII"): "Da lei do progresso",
 ("Parte Terceira","IX"): "Da lei de igualdade",
 ("Parte Terceira","X"): "Da lei de liberdade",
 ("Parte Terceira","XI"): "Da lei de justiça, de amor e de caridade",
 ("Parte Terceira","XII"): "Da perfeição moral",
 ("Parte Quarta","I"): "Das penas e gozos terrestres",
 ("Parte Quarta","II"): "Das penas e gozos futuros",
}

PARTES = {
 "Parte Primeira": "Parte Primeira — Das causas primárias",
 "Parte Segunda": "Parte Segunda — Do mundo espírita ou mundo dos Espíritos",
 "Parte Terceira": "Parte Terceira — Das leis morais",
 "Parte Quarta": "Parte Quarta — Das esperanças e consolações",
}

def normalizar(parte_bruta, capitulo_bruto):
    chave_parte = parte_bruta.split(" — ")[0].strip()
    romano = ""
    if "—" in capitulo_bruto:
        romano = capitulo_bruto.split("—")[0].replace("Capítulo", "").strip()
    titulo = TITULOS.get((chave_parte, romano))
    parte = PARTES.get(chave_parte, parte_bruta)
    capitulo = f"Capítulo {romano} — {titulo}" if titulo else capitulo_bruto
    return parte, capitulo


registros = []
for q in qs:
    pergunta = limpar_texto(q["pergunta"])
    resposta = limpar_texto(q["resposta"])

    # Itens expositivos (escala espirita, observacoes): o texto e o conteudo,
    # e o titulo antes do travessao vira o enunciado.
    if not resposta:
        m = re.match(r"^(.{3,80}?)\s*[—–-]\s*(.+)$", pergunta, re.S)
        if m:
            pergunta, resposta = titulo_bonito(m.group(1)), m.group(2).strip()
        else:
            pergunta, resposta = f"Questão {q['numero']}", pergunta

    if not pergunta or not resposta:
        continue

    parte_ok, capitulo_ok = normalizar(q["parte"], q["capitulo"])
    registros.append({
        "numero": q["numero"],
        "parte": parte_ok,
        "capitulo": capitulo_ok,
        "pergunta": pergunta,
        "resposta": resposta,
    })

print("registros:", len(registros))

LOTE = 210
os.makedirs("saida", exist_ok=True)
arquivos = []
for indice, comeco in enumerate(range(0, len(registros), LOTE), start=1):
    fatia = registros[comeco:comeco + LOTE]
    nome = f"saida/seed-questoes-{indice:02d}.sql"
    with io.open(nome, "w", encoding="utf-8") as f:
        f.write("-- ============================================================\n")
        f.write(f"-- O Livro dos Espiritos — questoes {fatia[0]['numero']} a {fatia[-1]['numero']}\n")
        f.write("-- Allan Kardec, traducao de Guillon Ribeiro (dominio publico).\n")
        f.write("-- Entram como RASCUNHO: nao aparecem no site ate serem publicadas.\n")
        f.write("-- Pode rodar mais de uma vez — atualiza em vez de duplicar.\n")
        f.write("-- ============================================================\n\n")
        f.write("insert into public.questoes (numero, parte, capitulo, pergunta, resposta, status)\nvalues\n")
        linhas = []
        for r in fatia:
            linhas.append(
                f"  ({r['numero']}, '{esc(r['parte'])}', '{esc(r['capitulo'])}',"
                f" '{esc(r['pergunta'])}', '{esc(r['resposta'])}', 'rascunho')")
        f.write(",\n".join(linhas))
        f.write("\non conflict (numero) do update\n"
                "  set parte = excluded.parte,\n"
                "      capitulo = excluded.capitulo,\n"
                "      pergunta = excluded.pergunta,\n"
                "      resposta = excluded.resposta;\n\n")
        f.write("select count(*) as questoes_cadastradas,\n"
                "       count(*) filter (where status = 'rascunho') as em_rascunho\n"
                "from public.questoes;\n")
    arquivos.append(nome)
    print(nome, len(fatia), f"{os.path.getsize(nome)/1024:.0f} KB")

print("\ncapitulos distintos:")
for c in sorted({r["capitulo"] for r in registros}):
    print("  ", c)
