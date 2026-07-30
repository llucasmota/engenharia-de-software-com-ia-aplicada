import { HumanMessage } from 'langchain';
import { OpenRouterService } from '../../services/openrouterService.ts';
import type { GraphState } from '../graph.ts';
import { type ConversationSummary, getSummarizationSystemPrompt, getSummarizationUserPrompt, SummarySchema } from '../../prompts/v1/summarization.ts';
import { Runtime } from '@langchain/langgraph';
import { PreferencesService } from '../../services/preferencesService.ts';
import { RemoveMessage } from '@langchain/core/messages';

export function createSummarizationNode(llmClient: OpenRouterService, preferencesService: PreferencesService) {
  return async (state: GraphState, runtime?: Runtime): Promise<Partial<GraphState>> => {

    const conversationHistory = state.messages.map(msg => ({
      role: HumanMessage.isInstance(msg) ? 'User' : 'AI',
      content: msg.text,
    }))

    const previousSumary = state.conversationSummary as ConversationSummary | undefined;

    const systemPrompt = getSummarizationSystemPrompt();
    const userPrompt = getSummarizationUserPrompt(conversationHistory, previousSumary);

    const result = await llmClient.generateStructured(systemPrompt, userPrompt, SummarySchema)


    if (result.error || !result.data) {
      console.log(`❌ Summarize has been failed`)

      return {
        needsSummarization: false,
      }
    }

    const userId = String(runtime?.context?.useId || state.userId || 'unknown')

    await preferencesService.storeSummary(userId, result.data)


    const deleteMessages = state.messages.slice(0, -2)
      .map(m => new RemoveMessage({ id: m.id as string }))

    return {
      messages: deleteMessages,
      conversationSummary: result.data,
      needsSummarization: false
    };
  };
}
