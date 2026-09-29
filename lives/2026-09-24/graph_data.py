"""
Base de conhecimento em grafo da NetFibra.

Um dicionário Python simples faz o papel do "banco de grafo"
ESTRUTURA DE CADA NÓ (`NODES[id]`):
    {
        "label": str,       # nome bonitinho, mostrado na tela e no prompt
        "type": str,        # "plano" | "equipamento" | "tecnologia" | "regiao" | "problema"
        "aliases": [str],   # termos que, se aparecerem no texto do usuário, apontam para este nó
        "attrs": {...},     # atributos livres (viram "fatos" para o LLM)
    }

ESTRUTURA DE CADA ARESTA (`EDGES`): uma tupla `(origem, destino, rótulo)`,
onde `origem` e `destino` são ids de `NODES` e `rótulo` é o nome da
relação (ex.: "requer", "suporta"). ISso vira texto no prompt e no desenho do
grafo na tela.

Base: 5 planos, 5 equipamentos,3 tecnologias, 4 regiões (cidades variadas, nenhuma delas a sua) 
e 4 problemas comuns --> 21 nós, 30 relações no total.

"""

NODES = {
    # -- Planos --------------------------------------------------------
    "plano_turbo_100": {
        "label": "Turbo 100",
        "type": "plano",
        "aliases": ["turbo 100", "turbo100"],
        "attrs": {"velocidade_contratada_mbps": 100, "preco_mensal_reais": 79},
    },
    "plano_turbo_300": {
        "label": "Turbo 300",
        "type": "plano",
        "aliases": ["turbo 300", "turbo300"],
        "attrs": {"velocidade_contratada_mbps": 300, "preco_mensal_reais": 99},
    },
    "plano_turbo_500": {
        "label": "Turbo 500",
        "type": "plano",
        "aliases": ["turbo 500", "turbo500"],
        "attrs": {"velocidade_contratada_mbps": 500, "preco_mensal_reais": 129},
    },
    "plano_turbo_940": {
        "label": "Turbo 940",
        "type": "plano",
        "aliases": ["turbo 940", "turbo940", "giga"],
        "attrs": {"velocidade_contratada_mbps": 940, "preco_mensal_reais": 179},
    },
    "plano_casa_conectada": {
        "label": "Casa Conectada 200",
        "type": "plano",
        "aliases": ["casa conectada", "200 mega"],
        "attrs": {"velocidade_contratada_mbps": 200, "preco_mensal_reais": 94},
    },
    # -- Equipamentos ----------------------------------------------------
    "equip_legacy_r4": {
        "label": "Roteador Legacy R4",
        "type": "equipamento",
        "aliases": ["legacy r4", "r4"],
        "attrs": {"velocidade_maxima_mbps": 150, "wifi": "Wi-Fi 4"},
    },
    "equip_compact_ax": {
        "label": "Roteador Compact AX",
        "type": "equipamento",
        "aliases": ["compact ax", "compact"],
        "attrs": {"velocidade_maxima_mbps": 300, "wifi": "Wi-Fi 5"},
    },
    "equip_nexus_600": {
        "label": "Roteador Nexus 600",
        "type": "equipamento",
        # "nexus" sozinho é proposital: é o mesmo termo dos dois modelos —
        # cria uma ambiguidade real para a demo do human-in-the-loop.
        "aliases": ["nexus 600", "nexus"],
        "attrs": {"velocidade_maxima_mbps": 600, "wifi": "Wi-Fi 6"},
    },
    "equip_nexus_1000": {
        "label": "Roteador Nexus 1000",
        "type": "equipamento",
        "aliases": ["nexus 1000", "nexus1000", "nexus"],
        "attrs": {"velocidade_maxima_mbps": 1000, "wifi": "Wi-Fi 6"},
    },
    "equip_radiomax": {
        "label": "Modem RadioMax",
        "type": "equipamento",
        "aliases": ["radiomax", "modem radio"],
        "attrs": {"velocidade_maxima_mbps": 300, "wifi": "Wi-Fi 5"},
    },
    # -- Tecnologias -----------------------------------------------------
    "tec_fibra": {
        "label": "Fibra Óptica",
        "type": "tecnologia",
        "aliases": ["fibra"],
        "attrs": {"velocidade_maxima_mbps": 940},
    },
    "tec_radio": {
        "label": "Rádio",
        "type": "tecnologia",
        "aliases": ["radio", "rádio"],
        "attrs": {"velocidade_maxima_mbps": 300},
    },
    "tec_cabo": {
        "label": "Cabo Coaxial",
        "type": "tecnologia",
        "aliases": ["cabo", "coaxial"],
        "attrs": {"velocidade_maxima_mbps": 500},
    },
    # -- Regiões de cobertura ---------------------------------------------
    "regiao_centro": {
        "label": "Curitiba - Centro",
        "type": "regiao",
        "aliases": ["curitiba centro", "centro de curitiba", "centro"],
        "attrs": {},
    },
    "regiao_rural": {
        "label": "Zona Rural de Ouro Preto",
        "type": "regiao",
        "aliases": ["zona rural", "área rural", "area rural", "ouro preto"],
        "attrs": {},
    },
    "regiao_recife": {
        "label": "Recife - Boa Viagem",
        "type": "regiao",
        "aliases": ["recife", "boa viagem", "recife boa viagem"],
        "attrs": {},
    },
    "regiao_bonito": {
        "label": "Zona Rural de Bonito",
        "type": "regiao",
        "aliases": ["zona rural de bonito", "rural de bonito", "bonito ms"],
        "attrs": {},
    },
    # -- Problemas comuns de suporte ---------------------------------------
    "problema_velocidade_baixa": {
        "label": "Velocidade abaixo do contratado",
        "type": "problema",
        "aliases": ["velocidade baixa", "internet lenta", "não passa de", "nao passa de"],
        "attrs": {},
    },
    "problema_conexao_cai": {
        "label": "Conexão cai o tempo todo",
        "type": "problema",
        "aliases": ["conexao cai", "internet caindo", "cai toda hora", "cai direto"],
        "attrs": {},
    },
    "problema_wifi_fraco": {
        "label": "Wi-Fi não alcança todos os cômodos",
        "type": "problema",
        "aliases": ["wifi fraco", "sinal fraco", "nao pega wifi", "não pega wifi"],
        "attrs": {},
    },
    "problema_sem_sinal": {
        "label": "Sem sinal após a instalação",
        "type": "problema",
        "aliases": ["sem sinal", "nao instalou", "não instalou"],
        "attrs": {},
    },
}

# (origem, destino, rótulo da relação), a "gramática" do nosso grafo:
#   plano       --requer-->          tecnologia
#   equipamento --suporta-->         tecnologia
#   equipamento --recomendado_para--> plano
#   regiao      --disponivel_em-->   tecnologia
#   problema    --causa_possivel_de--> equipamento | tecnologia
EDGES = [
    # Planos --requer--> Tecnologia
    ("plano_turbo_100", "tec_fibra", "requer"),
    ("plano_turbo_100", "tec_cabo", "requer"),
    ("plano_turbo_300", "tec_fibra", "requer"),
    ("plano_turbo_300", "tec_radio", "requer"),
    ("plano_turbo_500", "tec_fibra", "requer"),
    ("plano_turbo_500", "tec_cabo", "requer"),
    ("plano_turbo_940", "tec_fibra", "requer"),
    ("plano_casa_conectada", "tec_fibra", "requer"),
    ("plano_casa_conectada", "tec_radio", "requer"),
    # Equipamento --suporta--> Tecnologia
    ("equip_legacy_r4", "tec_radio", "suporta"),
    ("equip_compact_ax", "tec_fibra", "suporta"),
    ("equip_compact_ax", "tec_cabo", "suporta"),
    ("equip_nexus_600", "tec_fibra", "suporta"),
    ("equip_nexus_1000", "tec_fibra", "suporta"),
    ("equip_radiomax", "tec_radio", "suporta"),
    # Equipamento --recomendado_para--> Plano
    ("equip_legacy_r4", "plano_casa_conectada", "recomendado_para"),
    ("equip_compact_ax", "plano_turbo_100", "recomendado_para"),
    ("equip_compact_ax", "plano_casa_conectada", "recomendado_para"),
    ("equip_nexus_600", "plano_turbo_300", "recomendado_para"),
    ("equip_nexus_1000", "plano_turbo_940", "recomendado_para"),
    ("equip_radiomax", "plano_casa_conectada", "recomendado_para"),
    # Região --disponivel_em--> Tecnologia
    ("regiao_centro", "tec_fibra", "disponivel_em"),
    ("regiao_centro", "tec_cabo", "disponivel_em"),
    ("regiao_rural", "tec_radio", "disponivel_em"),
    ("regiao_recife", "tec_fibra", "disponivel_em"),
    ("regiao_bonito", "tec_radio", "disponivel_em"),
    # Problema --causa_possivel_de--> Equipamento | Tecnologia
    ("problema_velocidade_baixa", "equip_legacy_r4", "causa_possivel_de"),
    ("problema_conexao_cai", "tec_radio", "causa_possivel_de"),
    ("problema_wifi_fraco", "equip_legacy_r4", "causa_possivel_de"),
    ("problema_sem_sinal", "equip_radiomax", "causa_possivel_de"),
]


def find_entities(text: str) -> dict[str, list[str]]:
    """Procura, por substring, quais nós o texto menciona.

    Devolve {alias_encontrado: [node_id, ...]}. Quando a lista de um alias
    tem mais de um node_id, o termo é ambíguo (dois nós usam o mesmo
    alias), issoé o gancho que o agente usa para acionar o human-in-the-loop.
    """

    text_lower = text.lower()
    hits: dict[str, list[str]] = {}

    for node_id, node in NODES.items():
        for alias in node["aliases"]:
            if alias in text_lower:
                hits.setdefault(alias, []).append(node_id)

    return hits


def get_subgraph(entity_ids: list[str]) -> dict:
    """Expande 1 salto (vizinhos diretos) a partir dos ids informados.
    Ponto de atenção: o teste de "esta aresta toca uma âncora?" 
    usa sempre `anchors`, um conjunto FIXO, nunca o conjunto que estamos 
    construindo (`node_set`). Se testássemos contra um conjunto que cresce 
    durante a própria iteração, um nó "hub" (muito conectado, como uma 
    Tecnologia aqui: "Fibra Óptica" agora liga a 8 outros nós) faria a busca 
    virar uma cascata e trazer quase o grafo inteiro, em vez de só 1 salto.
    """

    anchors = set(entity_ids)
    edges_out = []
    neighbor_ids: set[str] = set()

    for src, dst, rel in EDGES:
        if src in anchors or dst in anchors:
            edges_out.append((src, dst, rel))

            neighbor_ids.add(src)
            neighbor_ids.add(dst)

    node_set = anchors | neighbor_ids
    nodes_out = {nid: NODES[nid] for nid in node_set if nid in NODES}

    return {"nodes": nodes_out, "edges": edges_out, "center_ids": entity_ids}


def facts_from_subgraph(subgraph: dict) -> list[str]:
    """Converte o subgrafo em frases curtas para entrar no prompt do LLM.

    É a ponte entre "estrutura de grafo" e "texto que um modelo de
    linguagem entende": nós viram frases tipo "Turbo 300 (plano) ->
    velocidade_contratada_mbps: 300", e arestas viram
    "Turbo 300 --[requer]--> Fibra Óptica".
    """

    facts: list[str] = []
    nodes = subgraph.get("nodes", {})

    for node in nodes.values():
        attrs_text = ", ".join(f"{k}: {v}" for k, v in node["attrs"].items())
        facts.append(f"{node['label']} ({node['type']}) — {attrs_text}" if attrs_text else f"{node['label']} ({node['type']})")

    for src, dst, rel in subgraph.get("edges", []):
        if src in nodes and dst in nodes:
            facts.append(f"{nodes[src]['label']} --[{rel}]--> {nodes[dst]['label']}")
            
    return facts
