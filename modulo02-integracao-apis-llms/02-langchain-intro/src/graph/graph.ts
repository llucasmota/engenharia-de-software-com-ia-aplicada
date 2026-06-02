import { END, MessagesZodMeta, START, StateGraph, StateSchema } from "@langchain/langgraph"
import { withLangGraph } from "@langchain/langgraph/zod"
import { BaseMessage } from "langchain"

import { z } from 'zod/v3'
import { identifyIntent } from "./nodes/identifyIntentNode.ts"
import { chatResponse } from "./nodes/chatResponseNode.ts"
import { lowerCaseNode } from "./nodes/lowerCaseNode.ts"
import { upperCaseNode } from "./nodes/upperCaseNode.ts"
import { Console } from "console"
import { fallbackNode } from "./nodes/fallbackNode.ts"



const GraphState = z.object({
  messages: withLangGraph(
    z.custom<BaseMessage[]>(),
    MessagesZodMeta
  ),
  output: z.string(),
  command: z.enum(['uppercase', 'lowercase', 'unknown'])
})


export type GraphState = z.infer<typeof GraphState>


export function buildGraph() {
  const workflow = new StateGraph({
    stateSchema: GraphState
  }).addNode('identifyIntent', identifyIntent)
    .addNode("chatResponse", chatResponse)
    .addNode("lowercase", lowerCaseNode)
    .addNode("uppercase", upperCaseNode)
    .addNode("fallback", fallbackNode)
    // .addNode("identifyIntent", (state: GraphState) => {

    //   return {
    //     ...state
    //   }
    // })
    .addEdge(START, "identifyIntent")
    .addConditionalEdges("identifyIntent", (state: GraphState) => {
      console.log(`state.command: ${state.command}`)
      switch (state.command) {

        case 'uppercase':
          return 'uppercase';
        case 'lowercase':
          return 'lowercase';
        default:
          return 'fallback'
      }


    }, {
      'uppercase': 'uppercase',
      'lowercase': 'lowercase',
      'fallback': 'fallback'
    })
    .addEdge("uppercase", "chatResponse")
    .addEdge("lowercase", "chatResponse")
    .addEdge("fallback", "chatResponse")
    .addEdge("chatResponse", END)

  return workflow.compile()
}