import { AIMessage } from "langchain";
import { type GraphState } from "../graph.ts";

export function chatResponse(state: GraphState): GraphState {
  const responseText = state.output
  const aiMessage = new AIMessage(responseText)

  return {
    ...state,
    messages: [
      ...state.messages,
      aiMessage
    ],
  }
}