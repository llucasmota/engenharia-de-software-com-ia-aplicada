# Temporal Process Manager Workshop

Workshop incremental sobre implementação de workflows com Temporal. Este workflow foi inspirado em um exemplo do livro _Enterprise Integration Patterns_ do Martin Fowler.Neste exemplo, um pedido é representado por um Workflow que coordena a reserva do estoque (Inventoty) e a autorização de pagamento (Payment) em paralelo. Por fim, cria a etiqueta de envio (Shipping) e nota fical (Invoice) em paralelo. 

O projeto é um monorepo pnpm com quatro aplicações executadas localmente:

- <code>process-manager</code>: API HTTP e Worker do Temporal;
- <code>inventory</code>: mock HTTP de reserva de Inventory;
- <code>billing</code>: mock HTTP de autorização de Payment e criação de Invoice;
- <code>shipping</code>: mock HTTP de Shipping, com falhas transitórias para demonstrar retry.

O único componente executado em container é o servidor local do Temporal.

## Início rápido

Use este fluxo se Node.js, pnpm e Docker Desktop/OrbStack já estiverem instalados e configurados. O passo a passo completo está na seção [Pré-requisitos](#pré-requisitos).

Na raiz do projeto:

~~~bash
nvm use
pnpm install --frozen-lockfile
pnpm run dev
~~~

Em outro terminal, crie um pedido e consulte o estado usando o `orderId` retornado:

~~~bash
pnpm run order:create
pnpm run order:get -- SEU_ORDER_ID
~~~

Para acompanhar a execução, abra a [Temporal UI](http://localhost:8080). A API do Process Manager fica em <http://localhost:3000>.

Ao terminar, pressione `Ctrl+C` no terminal do ambiente e desligue o Temporal:

~~~bash
pnpm run infra:down
~~~

## Pré-requisitos

### Hardware recomendado

Para executar todos os serviços simultaneamente, reserve pelo menos:

- 4 GB de memória RAM livres para Docker/OrbStack e os processos Node;
- 2 GB de espaço livre em disco para dependências e a imagem do Temporal;
- conexão com a internet na primeira instalação, para baixar dependências e a imagem Docker.

8 GB de RAM no computador é o recomendado para trabalhar com conforto. O projeto funciona em arquiteturas <code>x64</code> e <code>arm64</code>.

### Ferramentas

- Git;
- Node.js <code>24.21.0</code>, gerenciado por <code>nvm</code>. A versão recomendada está registrada em <code>.nvmrc</code>;
- <code>pnpm 12.4.2</code>, versão definida em <code>package.json</code>;
- Docker Desktop, OrbStack ou Docker Engine com o plugin Docker Compose;
- _Browser_ para acessar a Temporal UI;

Docker Desktop (Windows/macOS) e OrbStack (macOS) são alternativas. Não é necessário instalar os dois. O importante é que um daemon Docker esteja instalado, iniciado e acessível pelo terminal.

### Instalar e validar Docker

No macOS ou Windows, instale e abra o [Docker Desktop](https://www.docker.com/products/docker-desktop/) ou o [OrbStack](https://orbstack.dev/). No Linux, instale o Docker Engine e o plugin Compose.

~~~bash
docker --version
docker compose version
docker info
~~~

O comando <code>docker info</code> precisa terminar sem erro. Se não conseguir conectar ao daemon, abra o Docker Desktop/OrbStack e tente novamente.

## Configuração do Node.js, npm e pnpm

### macOS, Linux ou Windows via WSL2

Se ainda não tiver o <code>nvm</code>, instale-o conforme a [documentação oficial](https://github.com/nvm-sh/nvm):

Feche e abra o terminal depois da instalação. Na raiz do projeto:

~~~bash
nvm install
nvm use
node --version
npm --version
~~~

O comando <code>nvm install</code> lê o <code>.nvmrc</code> e instala o Node <code>24.21.0</code> caso necessário. O <code>npm</code> é instalado junto com o Node.js.

### Windows sem WSL2

Use [nvm-windows](https://github.com/coreybutler/nvm-windows) ou instale o Node.js <code>24.21.0</code> diretamente. Com <code>nvm-windows</code>, selecione a versão manualmente:

~~~powershell
nvm install 24.21.0
nvm use 24.21.0
node --version
npm --version
~~~

### Instalar o pnpm

O projeto usa <code>pnpm</code>, e não <code>npm install</code>, porque os pacotes estão organizados como workspace. Depois de ativar o Node correto:

~~~bash
npm install --global pnpm@12.4.2
pnpm --version
~~~

A versão do <code>pnpm</code> também está registrada no campo <code>packageManager</code> do <code>package.json</code>. Evite misturar <code>npm install</code> e <code>pnpm install</code> neste repositório.

## Instalação do projeto

Em uma instalação limpa, reproduza exatamente o lockfile:

~~~bash
pnpm install --frozen-lockfile
~~~

## Executando o ambiente completo

Antes de iniciar, certifique-se de que o Docker Desktop/OrbStack está aberto. Na raiz do projeto:

~~~bash
pnpm run dev
~~~

Esse comando inicia em paralelo o Temporal via <code>docker compose</code>, o Process Manager e os mocks de Inventory, Billing e Shipping. Na primeira execução, o Docker pode baixar a imagem <code>temporalio/temporal:latest</code>. Mantenha o terminal aberto e use <code>Ctrl+C</code> para interromper os processos Node.

Os serviços ficam disponíveis em:

| Serviço | URL |
| --- | --- |
| Process Manager | <http://localhost:3000> |
| Inventory | <http://localhost:3001> |
| Billing | <http://localhost:3002> |
| Shipping | <http://localhost:3003> |
| Temporal gRPC | <code>localhost:7233</code> |
| Temporal UI | <http://localhost:8080> |

O Process Manager aguarda o Temporal ficar disponível antes de iniciar o Worker. Alguns segundos de espera na primeira inicialização são esperados.

### Executar os componentes separadamente

Para acompanhar cada log em um terminal:

Terminal 1:

~~~bash
pnpm run infra:up
~~~

Terminal 2:

~~~bash
pnpm run process-manager:up
~~~

Terminais adicionais:

~~~bash
pnpm run inventory:up
pnpm run billing:up
pnpm run shipping:up
~~~

## Parar o ambiente

Se iniciou com <code>pnpm run dev</code>, pressione <code>Ctrl+C</code> no terminal principal para parar os processos Node. Depois, remova o container do Temporal:

~~~bash
pnpm run infra:down
~~~

O equivalente direto é:

~~~bash
docker compose down
~~~

Para verificar o estado e os logs do container:

~~~bash
docker compose ps
docker compose logs -f temporal
~~~

## Criar e consultar pedidos

O utilitário padrão cria um pedido e imprime o <code>orderId</code> e o <code>workflowId</code>:

~~~bash
pnpm run order:create
~~~

A criação é assíncrona e responde com HTTP <code>202</code>. Copie o <code>orderId</code> e consulte o pedido:

~~~bash
pnpm run order:get -- SEU_ORDER_ID
~~~

O campo <code>state</code> pode ser:

- <code>RECEIVED</code>: pedido registrado;
- <code>VALIDATING</code>: Inventory reservation e Payment authorization em paralelo;
- <code>FULFILLING</code>: Shipping e Invoice em paralelo;
- <code>COMPLETED</code>: todas as etapas terminaram com sucesso;
- <code>FAILED</code>: alguma etapa terminou com falha definitiva.

Shipping falha nas três primeiras tentativas. Aguarde alguns segundos e consulte novamente para observar a transição até <code>COMPLETED</code>.

Não existe um script <code>order:demo</code>. O fluxo equivalente é executar <code>order:create</code> e, em seguida, <code>order:get</code> com o <code>orderId</code> retornado.

### Personalizar um pedido

O comando <code>order:create</code> aceita:

| Variável | Padrão | Uso |
| --- | --- | --- |
| <code>PROCESS_MANAGER_URL</code> | <code>http://localhost:3000</code> | URL da API do Process Manager |
| <code>CUSTOMER_ID</code> | <code>customer-1</code> | Identificador do Customer |
| <code>SKU</code> | <code>sku-5</code> | Produto a reservar |
| <code>QUANTITY</code> | <code>1</code> | Quantidade solicitada |
| <code>CARD_NUMBER</code> | <code>1111111111111111</code> | Cartão usado na autorização |
| <code>AMOUNT</code> | <code>1999.9</code> | Valor da Invoice |

No macOS/Linux/WSL2:

~~~bash
SKU=sku-5 QUANTITY=2 AMOUNT=2500 pnpm run order:create
~~~

No Windows PowerShell:

~~~powershell
$env:SKU = "sku-5"
$env:QUANTITY = "2"
$env:AMOUNT = "2500"
pnpm run order:create
~~~

Para alterar a URL do Process Manager:

~~~bash
PROCESS_MANAGER_URL=http://localhost:3000 pnpm run order:create
~~~

No PowerShell:

~~~powershell
$env:PROCESS_MANAGER_URL = "http://localhost:3000"
pnpm run order:create
~~~

## Cenários do workshop

Os mocks são determinísticos:

| Cenário | Comando ou configuração | Resultado |
| --- | --- | --- |
| Sucesso completo | <code>pnpm run order:create</code> | <code>COMPLETED</code> após retries de Shipping |
| Falha de Inventory | <code>pnpm run order:fail:inventory</code> | <code>FAILED</code> usando <code>sku-1</code> |
| Falha de Payment authorization | <code>pnpm run order:fail:payment</code> | <code>FAILED</code> usando <code>0000000000000000</code> |
| Cartão desconhecido | <code>CARD_NUMBER=2222222222222222 pnpm run order:create</code> | <code>FAILED</code> com <code>UNKNOWN_CARD</code> |
| Retry de Shipping | qualquer pedido aprovado | três respostas <code>503</code> e sucesso na quarta tentativa |

Produtos e cartões disponíveis:

- <code>sku-5</code> (<code>Macbook M5 Pro</code>) reserva com sucesso;
- <code>sku-1</code> (<code>Macbook M1 Pro</code>) responde <code>422 INSUFFICIENT_INVENTORY</code>;
- <code>1111111111111111</code> é autorizado;
- <code>0000000000000000</code> responde <code>402 PAYMENT_DECLINED</code>;
- qualquer outro cartão responde <code>422 UNKNOWN_CARD</code>.

Abra a [Temporal UI](http://localhost:8080) para acompanhar o Workflow, suas Activities, retries e o histórico. O <code>workflowId</code> é igual ao <code>orderId</code>.

## Testar a API diretamente com curl

Criar um pedido:

~~~bash
curl -X POST http://localhost:3000/orders -H 'Content-Type: application/json' -d '{"customerId":"customer-1","sku":"sku-5","quantity":1,"cardNumber":"1111111111111111","amount":1999.90}'
~~~

Consultar o pedido:

~~~bash
curl http://localhost:3000/orders/SEU_ORDER_ID
~~~

No PowerShell, use <code>curl.exe</code> para evitar o alias <code>curl</code>:

~~~powershell
curl.exe -X POST http://localhost:3000/orders -H 'Content-Type: application/json' -d '{"customerId":"customer-1","sku":"sku-5","quantity":1,"cardNumber":"1111111111111111","amount":1999.90}'
~~~

## Contratos HTTP

### Process Manager

| Método | Endpoint | Uso | Resposta |
| --- | --- | --- | --- |
| <code>POST</code> | <code>/orders</code> | registra o pedido e inicia o Workflow | <code>202</code> com <code>orderId</code> e <code>workflowId</code> |
| <code>GET</code> | <code>/orders/:orderId</code> | consulta dados e estado | <code>200</code> com a entidade |

Payload de criação:

~~~json
{
  "customerId": "customer-1",
  "sku": "sku-5",
  "quantity": 1,
  "cardNumber": "1111111111111111",
  "amount": 1999.90
}
~~~

O <code>GET</code> retorna <code>orderId</code>, <code>workflowId</code>, <code>createdAt</code>, <code>customerId</code>, <code>sku</code>, <code>quantity</code>, <code>amount</code> e <code>state</code>. O número do cartão é usado somente para autorização e não é persistido.

### Serviços simulados

| Serviço | Endpoint | Uso |
| --- | --- | --- |
| Inventory | <code>POST /inventory/reservations</code> | reserva SKU e quantidade |
| Billing | <code>POST /billing/authorizations</code> | autoriza o cartão |
| Billing | <code>POST /billing/invoices</code> | cria a Invoice |
| Shipping | <code>POST /shipping/shipments</code> | solicita o Shipment |

O Process Manager chama esses endpoints nas URLs padrão <code>http://localhost:3001</code>, <code>http://localhost:3002</code> e <code>http://localhost:3003</code>.

## Variáveis de ambiente dos serviços

Os valores abaixo são opcionais:

| Variável | Padrão | Componente |
| --- | --- | --- |
| <code>PORT</code> | <code>3000</code> | porta HTTP do Process Manager |
| <code>TEMPORAL_ADDRESS</code> | <code>127.0.0.1:7233</code> | endereço gRPC do Temporal |
| <code>TEMPORAL_NAMESPACE</code> | <code>default</code> | namespace do Temporal |
| <code>INVENTORY_URL</code> | <code>http://localhost:3001</code> | URL do Inventory |
| <code>BILLING_URL</code> | <code>http://localhost:3002</code> | URL do Billing |
| <code>SHIPPING_URL</code> | <code>http://localhost:3003</code> | URL do Shipping |

Exemplo:

~~~bash
TEMPORAL_ADDRESS=127.0.0.1:7233 PORT=3000 pnpm run process-manager:up
~~~

## Scripts disponíveis

Execute-os na raiz do projeto:

| Script | Finalidade |
| --- | --- |
| <code>pnpm run dev</code> | inicia Temporal, Process Manager e os três mocks |
| <code>pnpm run infra:up</code> | inicia somente o Temporal |
| <code>pnpm run infra:down</code> | para e remove o container do Temporal |
| <code>pnpm run process-manager:up</code> | inicia o Process Manager |
| <code>pnpm run inventory:up</code> | inicia o mock de Inventory |
| <code>pnpm run billing:up</code> | inicia o mock de Billing |
| <code>pnpm run shipping:up</code> | inicia o mock de Shipping |
| <code>pnpm run order:create</code> | cria um pedido |
| <code>pnpm run order:get -- SEU_ORDER_ID</code> | consulta um pedido |
| <code>pnpm run order:fail:inventory</code> | cria um pedido que falha em Inventory |
| <code>pnpm run order:fail:payment</code> | cria um pedido que falha em Payment |
| <code>pnpm run build</code> | compila os pacotes que possuem build |
| <code>pnpm run typecheck</code> | verifica os tipos em todos os pacotes |

## Limitações e extensões futuras

O repositório é um workshop. O primeiro escopo mantém testes automatizados e Activities de Compensation fora do fluxo principal. A persistência do Process Manager é em memória: reiniciar a aplicação descarta os pedidos registrados.

Extensões sugeridas:

- adicionar testes observando o Process Manager e o Workflow por interfaces públicas;
- implementar Compensation para liberar uma reserva de Inventory quando uma etapa posterior falhar;
- substituir o repositório em memória por um banco persistente.
