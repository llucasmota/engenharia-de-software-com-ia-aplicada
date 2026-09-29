import type { GraphState } from '../graph.ts';

export function createExtractQuestionNode() {

  return async (state: GraphState): Promise<Partial<GraphState>> => {
    try {

      const lastMessage = state.messages?.at(-1);
      // No LangChain/LangGraph, o texto fica em .content (string ou text block)
      let messageContent = '';
      if (typeof lastMessage?.content === 'string') {
        messageContent = lastMessage.content;
      } else if (Array.isArray(lastMessage?.content)) {
        // Suporte caso venha em blocos de texto [{ type: 'text', text: '...' }]
        messageContent = lastMessage.content
          .map((part: any) => part.text || '')
          .join(' ');
      } else if ((lastMessage as any)?.text) {
        messageContent = (lastMessage as any).text;
      }
      // Prioriza a pergunta da mensagem ou uma question já presente no state
      const question = (messageContent || state.question || '').trim();


      // if (!state.messages?.length) {
      //   console.error('No messages in state');
      //   return {
      //     ...state,
      //     error: 'No messages provided',
      //   };
      // }


      if (!question.trim()) {
        console.error('Extracted question is empty');
        return {
          ...state,
          error: 'No valid question found in messages',
        };
      }

      console.log(`📝 Extracted question: "${question}"`);

      return {
        ...state,
        question,
      };
    } catch (error: any) {
      console.error('Error extracting question:', error.message);
      return {
        ...state,
        error: `Failed to extract question: ${error.message}`,
      };
    }
  };
}
