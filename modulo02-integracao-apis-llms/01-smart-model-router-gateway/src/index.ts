import { createServer } from './server.ts'
import { config } from './config.ts'
import { OpenRouterService } from './openrouterService.ts'


const app = createServer(new OpenRouterService(config))

await app.listen({ port: 3000, host: '0.0.0.0' })

app.log.info('server runnning at 3000')

app.inject({
  method: 'POST',
  url: '/chat',
  body: { question: 'do a resume about Enoch book ' }
}).then((response) => {
  console.log('Response status', response.body)
  console.log('Response response', response.body)

})