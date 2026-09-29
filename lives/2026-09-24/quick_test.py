"""
Testa o agente pelo terminal, sem precisar do Streamlit.

Útil durante a construção: dá pra ver o agente funcionando, os
logs de cada nó, e o human-in-the-loop pausando/retomando sem esperar a
UI do navegador recarregar. Os logs configurados em `agent.py` já
aparecem automaticamente aqui:

    python quick_test.py
"""


from langgraph.types import Command

from agent import build_agent

agent = build_agent()
config = {"configurable": {"thread_id": "teste-terminal"}}

pergunta = "Quais tecnologias o Turbo 940 aceita?"
print(f"\n>>> {pergunta}")
result = agent.invoke({"user_input": pergunta}, config)
print(f"<<< {result.get('final_answer')}")

pergunta2 = "Meu roteador é o Nexus, funciona com o Turbo 940?"
print(f"\n>>> {pergunta2}")
result = agent.invoke({"user_input": pergunta2}, config)

if "__interrupt__" in result:
    payload = result["__interrupt__"][0].value
    print(f"\n[PAUSADO] {payload['question']}")

    for c in payload["candidates"]:
        print(f"  - {c['id']}: {c['label']}")

    escolha = input("Digite o id escolhido: ").strip()
    result = agent.invoke(Command(resume=escolha), config)

print(f"<<< {result.get('final_answer')}")
