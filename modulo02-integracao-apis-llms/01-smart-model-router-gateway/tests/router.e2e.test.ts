import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from '../src/server.ts'
import { config } from '../src/config.ts'
import { type LLMResponse, OpenRouterService } from '../src/openrouterService.ts'


console.assert(
    process.env.OPENROUTER_API_KEY,
    'OPENROUTER_API_KEY is not set in env variables'
)

test.todo('routes to cheapest model by default', async () => {
    const customConfig = {
        ...config,
        provider: {
            ...config.provider,
            sort: {
                ...config.provider.sort,
                by: 'price'
            }
        }

    }
    const routerService = new OpenRouterService(customConfig)
    const app = createServer(routerService)

    app.inject({
        method: 'POST',
        url: '/chat',
        body: { question: 'What is rate limit?' }
    }).then((response) => {
        console.log('Response status', response.body)
        console.log('Response response', response.body)

        assert.equal(response.statusCode, 200);
        const modelResponse = response.json() as LLMResponse;

        assert.equal(modelResponse.model, 'openaroutcer/owle-ai/trinity-lpharge-preview:free');
        console.log(modelResponse)


    })
})
test.todo('routes to highest throughput by default')
test.todo('routes to fastest model by default')