export type ModelConfig = {
  apiKey: string;
  httpReferer: string;
  xTitle: string;

  provider: {
    sort: {
      by: string;
      partition: string;
    };
  };

  models: string[];
  temperature: number;
};

console.assert(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY is not set in environment variables');

export const config: ModelConfig = {
  apiKey: process.env.OPENAI_API_KEY!,
  httpReferer: '',
  xTitle: 'IA Devs - Prompt Chaining Article Generator',
  models: [
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    // https://openrouter.ai/models?fmt=cards&max_price=0&order=throughput-high-to-low&supported_parameters=structured_outputs%2Cresponse_format
    'nvidia/nemotron-3-ultra-550b-a55b:free',
  ],
  provider: {
    sort: {
      by: 'throughput', // Route to model with highest throughput (fastest response)
      partition: 'none',
    },

  },
  temperature: 0.7,
};
