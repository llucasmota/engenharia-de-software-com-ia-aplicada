"""
Conexão com o modelo de linguagem, via OpenRouter.

OpenRouter expõe uma API compatível com a da OpenAI, então usamos
`ChatOpenAI` (do pacote `langchain-openai`) apontando o `base_url` para lá,
sem precisar de um SDK dedicado.

"""


import logging
import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv() 

log = logging.getLogger("netfibra.llm")

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def get_llm(temperature: float = 0.2) -> ChatOpenAI:
    """Cria o cliente de chat. `temperature` baixa (0.2) deixa as respostas
    mais consistentes/previsíveis."""

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENROUTER_API_KEY não configurada. Copie .env.example para .env "
            "e cole uma chave de https://openrouter.ai/keys"
        )

    model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
    log.info("Criando cliente LLM (modelo=%s, via OpenRouter)", model)

    return ChatOpenAI(model=model, api_key=api_key, base_url=OPENROUTER_BASE_URL, temperature=temperature)
