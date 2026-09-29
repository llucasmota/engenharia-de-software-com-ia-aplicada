"""
Interface Streamlit -> chat + visualização do caminho no grafo.

Paraa rodar: `streamlit run app.py`

CONCEITO-CHAVE DO STREAMLIT: a cada interação (mensagem enviada, botão
clicado), o Streamlit reexecuta ESTE ARQUIVO INTEIRO de cima a baixo de
novo (isso se chama um "rerun"). `st.session_state` é a única coisa que
sobrevive entre reruns. É por isso que guardamos o histórico do chat, o
`thread_id` e a pausa pendente do human-in-the-loop nele, e não em
variáveis Python comuns (que seriam recriadas do zero a cada rerun).

LOGS NO TERMINAL: mantenha o terminal onde você rodou `streamlit run
app.py`, podemos ver cada mensagem, cada pausa e retomada do
human-in-the-loop aparece ali em tempo real (ver `agent.py` para a
configuração do logging).

"""

import uuid
import logging
import streamlit as st

from langgraph.types import Command
from streamlit_agraph import Config, Edge, Node, agraph

import graph_data
from agent import build_agent

log = logging.getLogger("netfibra.streamlit")

st.set_page_config(page_title="NetFibra · Suporte com IA", page_icon="🛠️", layout="wide")
st.title("🛠️ NetFibra · Suporte com IA")
st.caption("LangGraph + GraphRAG + human-in-the-loop, com um modelo OpenRouter.")

# Cor por tipo de nó — usada tanto na legenda da barra lateral quanto no
# desenho do subgrafo (painel da direita), para a mesma cor sempre
# significar o mesmo tipo de entidade.
NODE_TYPE_COLORS = {
    "plano": "#5fd4c4",
    "equipamento": "#ff8f6b",
    "regiao": "#8fb8ff",
    "tecnologia": "#e3c66c",
    "problema": "#e97b8f",
}
NODE_TYPE_LABELS_PT = {
    "plano": "Plano",
    "equipamento": "Equipamento",
    "regiao": "Região",
    "tecnologia": "Tecnologia",
    "problema": "Problema",
}

# Nomes bonitos para cada nó do agente, na ordem em que aparecem no fluxo
# usado para desenhar o painel "Trilha de execução". Um nó que não
# rodou neste turno (ex.: "escalate" numa pergunta de grafo) aparece
# apagado.
TRACE_ORDER = [
    ("router", "Roteamento"),
    ("resolve_entities", "Resolução de entidades"),
    ("retrieve_from_graph", "Recuperação no grafo"),
    ("generate_answer", "Geração da resposta"),
    ("escalate", "Escalonamento humano"),
]


@st.cache_resource(show_spinner=False)
def get_agent():
    """`@st.cache_resource` garante que o agente é montado UMA VEZ por
    processo do Streamlit, não a cada rerun. E é o que faz o
    `MemorySaver` (dentro de `build_agent()`) continuar vivo entre
    mensagens, o que é indispensável para o human-in-the-loop funcionar."""

    return build_agent()


def _init_session_state() -> None:
    if "thread_id" not in st.session_state:
        # Um id por ABA DO NAVEGADOR: é o que isola sua conversa da de
        # outra pessoa testando o mesmo app ao mesmo tempo, mesmo
        # compartilhando o mesmo agente cacheado acima.
        st.session_state.thread_id = str(uuid.uuid4())
    if "history" not in st.session_state:
        st.session_state.history = []
    if "pending" not in st.session_state:
        st.session_state.pending = None
    if "last_subgraph" not in st.session_state:
        st.session_state.last_subgraph = {"nodes": {}, "edges": [], "center_ids": []}
    if "last_trace" not in st.session_state:
        st.session_state.last_trace = []


_init_session_state()


def _config() -> dict:
    return {"configurable": {"thread_id": st.session_state.thread_id}}


def apply_result(result: dict) -> None:
    """Interpreta o retorno de `agent.invoke(...)`: ou é uma PAUSA
    (human-in-the-loop) ou é o resultado final do turno.

    Como saber qual dos dois: quando algum nó chamou `interrupt(...)`, o
    dicionário devolvido por `.invoke(...)` ganha a chave extra
    `"__interrupt__"` --> ausência dela = turno terminou normalmente.
    """

    st.session_state.last_trace = result.get("trace", st.session_state.last_trace)

    if "__interrupt__" in result:
        payload = result["__interrupt__"][0].value
        log.info("⏸️  Interrupt recebido pela UI: %s", payload["question"])

        st.session_state.pending = payload

        return

    st.session_state.pending = None
    st.session_state.last_subgraph = result.get("subgraph", {"nodes": {}, "edges": [], "center_ids": []})

    answer = result.get("final_answer", "(sem resposta)")
    st.session_state.history.append(("assistant", answer))

    log.info("✅ Turno concluído, resposta exibida na tela.")


with st.sidebar:
    st.markdown("### 🕸️ Legenda do grafo")

    legend_html = "".join(
        f'<span style="display:inline-block;padding:2px 10px;margin:2px;border-radius:999px;'
        f'font-size:0.75rem;font-weight:600;background:{color}22;color:{color};'
        f'border:1px solid {color}">{NODE_TYPE_LABELS_PT[t]}</span>'
        for t, color in NODE_TYPE_COLORS.items()
    )
    st.markdown(legend_html, unsafe_allow_html=True)

    with st.expander("📚 Base de conhecimento completa"):
        by_type: dict[str, list[str]] = {}

        for node in graph_data.NODES.values():
            by_type.setdefault(node["type"], []).append(node["label"])

        for node_type, label_pt in NODE_TYPE_LABELS_PT.items():
            labels = by_type.get(node_type, [])

            if labels:
                st.markdown(f"**{label_pt}**")
                st.markdown("\n".join(f"- {lbl}" for lbl in labels))

    st.divider()
    st.markdown("### Roteiro de demo rápido")
    st.markdown(
        "1. `Quais tecnologias o Turbo 940 aceita?`\n"
        "2. `Meu plano é Turbo 300 e meu roteador é Legacy R4, "
        "por que minha velocidade não passa de 100?`\n"
        "3. `Meu Wi-Fi não alcança todos os cômodos, uso o roteador Legacy R4`\n"
        "4. `Meu roteador é o Nexus, funciona com o Turbo 940?` "
        "← dispara o human-in-the-loop\n"
        "5. `Isso não resolveu, quero falar com um atendente`\n\n"
        "Mais 5 exemplos no `ROTEIRO.md`."
    )

    st.divider()
    if st.button("🔄 Reiniciar conversa", use_container_width=True):
        log.info("🔄 Conversa reiniciada pelo usuário.")

        for key in ("thread_id", "history", "pending", "last_subgraph", "last_trace"):
            st.session_state.pop(key, None)

        st.rerun()

col_chat, col_graph = st.columns([0.6, 0.4], gap="large")

with col_chat:
    for role, content in st.session_state.history:
        st.chat_message(role).write(content)

    # Enquanto há uma pausa pendente, a pessoa só pode responder a ELA —
    # o campo de chat normal nem aparece. Não dá pra mandar uma pergunta
    # nova enquanto o agente espera uma decisão sobre a anterior.
    if st.session_state.pending is not None:
        payload = st.session_state.pending

        st.info(f"⏸️ {payload['question']}")

        labels = [c["label"] for c in payload["candidates"]]
        choice = st.radio("Qual é a sua opção?", labels, label_visibility="collapsed")

        if st.button("Confirmar", type="primary"):
            chosen_id = next(c["id"] for c in payload["candidates"] if c["label"] == choice)

            log.info("▶️  Usuário escolheu %r na tela — retomando o agente.", chosen_id)

            with st.spinner("Retomando..."):
                # `Command(resume=chosen_id)` retoma a execução exatamente
                # na linha `interrupt(...)` de `agent.py`, com este valor
                # como retorno daquela chamada.
                result = get_agent().invoke(Command(resume=chosen_id), _config())
            apply_result(result)

            st.rerun()
    else:
        user_input = st.chat_input("Escreva sua mensagem para a NetFibra...")

        if user_input:
            log.info("📩 Mensagem recebida da UI: %r", user_input)

            st.session_state.history.append(("user", user_input))

            try:
                with st.spinner("Pensando..."):
                    # Início de um turno NOVO: sempre `.invoke({"user_input": ...}, config)`,
                    # nunca `Command(resume=...)` (isso é só para retomar uma pausa).
                    result = get_agent().invoke({"user_input": user_input}, _config())

                apply_result(result)
            except Exception as exc:  # noqa: BLE001 — feedback amigável na demo
                log.exception("Erro ao processar mensagem")

                st.session_state.history.append(("assistant", f"⚠️ Erro: {exc}"))

            st.rerun()

with col_graph:
    st.markdown("#### 🕸️ Caminho no grafo de conhecimento")

    sub = st.session_state.last_subgraph
    if sub.get("nodes"):
        center_ids = set(sub.get("center_ids", []))

        nodes = [
            Node(
                id=nid,
                label=node["label"],
                size=32 if nid in center_ids else 20,
                color=NODE_TYPE_COLORS.get(node["type"], "#9aa6ad"),
                borderWidth=3 if nid in center_ids else 1,
            )
            for nid, node in sub["nodes"].items()
        ]

        edges = [Edge(source=s, target=t, label=rel) for s, t, rel in sub["edges"]]
        agraph(nodes=nodes, edges=edges, config=Config(height=380, width=380, directed=True, physics=True))
    else:
        st.caption("Nenhum trecho do grafo foi consultado ainda nesta conversa.")

    st.markdown("#### 🧭 Trilha de execução (LangGraph)")

    executed = {step["node"] for step in st.session_state.last_trace}
    detail_by_node = {step["node"]: step.get("detail", "") for step in st.session_state.last_trace}

    for node_id, label in TRACE_ORDER:
        active = node_id in executed

        detail = detail_by_node.get(node_id, "")
        style = "color:#f6f4ef;font-weight:600" if active else "color:#5b6470"
        dot_color = "#5fd4c4" if active else "#333a44"
        detail_text = f" — <i>{detail}</i>" if (active and detail) else ""
        
        st.markdown(
            f'<div style="{style};padding:4px 0">'
            f'<span style="display:inline-block;width:8px;height:8px;border-radius:50%;'
            f'background:{dot_color};margin-right:8px"></span>{label}{detail_text}</div>',
            unsafe_allow_html=True,
        )
