import { AIMessage, SystemMessage } from "langchain";
import { type GraphState } from "../graph.ts";

export function fallbackNode(state: GraphState): GraphState {
  const message = "Unknow command. Try 'mae this uppercase' or 'converte to lowercase'";
  const fallbackMessage = new AIMessage(message).content.toString();
  return {
    ...state,
    output: fallbackMessage,
    messages: [
      ...state.messages,
      new SystemMessage('Hey there')
    ]
  }
}