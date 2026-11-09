# SEO, GEO & AEO

- **Data:** 30 de setembro de 2026
- **Professores:**
  - [**Aurélio Oliveira**](https://www.linkedin.com/in/aurelioolive/)
  - [**Weslley Araújo**](https://www.linkedin.com/in/wellwelwel/)
- **Curadoria do Material:**
  - [**Weslley Araújo**](https://github.com/wellwelwel)

Este estudo parte das métricas e observações de SEO, GEO e AEO do [**Awesome You**](https://awesomeyou.io) e da [**Lagune.ai**](https://lagune.ai), como apresentado na Live de forma prática.

> [!NOTE]
>
> Cada abordagem descrita é uma prática real desses dois projetos: inspiração para adaptar ao contexto do seu, não recomendação absoluta. Quatro frentes que se reforçam definem o que o buscador, a IA e o usuário recebem:
>
> - **SEO clássico**
> - **dados estruturados** (base de AEO e GEO)
> - **GEO/LLMO** (conteúdo pronto para IAs)
> - **Performance e Compartilhamento Social**

> [!TIP]
>
> Ambos os projetos base são públicos e open source, logo, você pode estudar, adaptar e implementar as práticas descritas sem restrições diretamente do código fonte ou usando o [**Gitingest**](https://gitingest.com/) para explorá-los através do agente de sua preferência.

---

## 1. SEO técnico (rastreamento e indexação)

**1.1 `robots.txt` com liberação total**

- **Vantagem:** nenhuma página fica bloqueada e o arquivo aponta para o sitemap.
- **Na ponta:** o Googlebot e os demais robôs descobrem e rastreiam o site inteiro sem atrito.

> [!IMPORTANT]
>
> A liberação total funciona nos dois projetos base porque todo o conteúdo deles é público. Em um projeto com áreas privadas, ambientes de preview ou rotas sem valor de busca, você pode gerenciar o que os sistemas de busca rastreiam ou não.

**1.2 Meta robots de alcance máximo**

- Definida como `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`.
- **Vantagem:** autoriza o buscador a mostrar trechos de qualquer tamanho e imagens grandes.
- **Na ponta:** a SERP pode exibir snippets longos, o Discover pode usar a imagem grande e as IAs de busca (AI Overviews, por exemplo) podem citar trechos extensos.

**1.3 Sitemap XML com prioridade por nível**

- A home recebe 1.0, `/docs` 0.9, get-started, agentes, categorias e paper 0.8, comandos 0.7, referências e hooks 0.6. Todas as URLs têm `lastmod` e `changefreq: weekly`.
- **Vantagem:** mostra ao buscador a hierarquia do site e a data de atualização de cada página.
- **Na ponta:** as páginas-chave são rastreadas primeiro e o conteúdo atualizado é recrawleado mais rápido. O Google se guia pelo `lastmod` e costuma ignorar `priority` e `changefreq`.

**1.4 Sitemap com os arquivos para IA**

- `llms.txt` e `llms-full.txt` entram no sitemap como URLs de primeira classe.
- **Na ponta:** os robôs descobrem os índices para LLM sem depender de convenção.

**1.5 URLs canônicas e consistentes**

- A home e a `/share` declaram `<link rel="canonical">` diretamente e as docs a recebem automaticamente no build. As URLs têm uma forma única e fixa, sem barra final.
- **Vantagem:** evita conteúdo duplicado entre variações da mesma URL.
- **Na ponta:** a relevância se concentra em uma única URL por página.

**1.6 Links quebrados bloqueiam o build**

- O build falha diante de qualquer link, âncora ou link Markdown quebrado.
- **Vantagem:** nenhum link interno quebrado chega a produção.
- **Na ponta:** o rastreamento não esbarra em 404 e a autoridade flui entre as páginas.

**1.7 Datas vindas do histórico de commits**

- A data de publicação vem do primeiro commit do arquivo e a de modificação, do último.
- **Vantagem:** as datas são reais e automáticas, então funcionam como sinal de frescor.
- **Na ponta:** aparecem no JSON-LD, no texto "Last updated on..." das docs e nos twins Markdown. Buscadores e IAs dão peso a elas.

---

## 2. SEO on-page

**2.1 Títulos otimizados por página**

- A home usa "AI-Driven Security Hardening for Any Codebase | Lagune", no formato palavra-chave mais marca. As docs usam o título do frontmatter, por exemplo "Lagune Glossary: SDH, Charter, Findings, and Controls".
- **Na ponta:** gera um título clicável e rico em termos de busca na SERP.

**2.2 Meta description por página**

- Há uma descrição padrão para o site todo, uma própria na home e em `/share`, e uma no frontmatter de todas as 31 docs.
- **Na ponta:** controla o texto do snippet e, com isso, influencia o CTR.

**2.3 Meta keywords**

- Definidas para o site todo e no frontmatter de 13 docs.
- **Na ponta:** o impacto é praticamente nulo no Google, que ignora essa tag. Pode servir a buscadores menores e a ferramentas internas.

**2.4 Idioma e localidade**

- `lang="en"`, `og:locale en_US` e `inLanguage: 'en'` no JSON-LD.
- **Na ponta:** o conteúdo aparece para o público do idioma correto.

**2.5 Hierarquia semântica e linkagem interna**

- Cada doc tem um único H1, com o título no banner, e um H2/H3 por seção.
- A linkagem interna vem do TOC, da sidebar, da paginação anterior/próxima e dos links do rodapé.
- **Na ponta:** o conteúdo fica mais fácil de entender, os sitelinks e links âncora ficam melhores e a autoridade se distribui entre as páginas.

**2.6 Clusters de conteúdo por intenção**

- Glossário, paper metodológico e comparação com OpenSpec, Spec Kit e Skills.sh.
- **Vantagem:** cobrem buscas informacionais ("o que é SDH") e comparativas ("Lagune vs Spec Kit").
- **Na ponta:** o site ranqueia para termos de cauda longa e para comparações de concorrentes.

---

## 3. Dados estruturados em Schema.org / JSON-LD (base de SEO, AEO e GEO)

Todos os blocos usam `@id` estáveis que se referenciam entre si (`#author`, `#organization`, `#website`, `#software`), formando um **grafo de entidades**.

**3.1 Person**, em todo o site

- Autor com `knowsAbout` e `sameAs` apontando para o GitHub.
- **Na ponta:** reforça E-E-A-T (autoria e especialidade). Buscadores e IAs associam o conteúdo a um especialista identificável.

**3.2 Organization com desambiguação**, em todo o site

- Traz `alternateName` (Lagune AI, Lagune Security, lagune.ai), `logo`, `sameAs` (GitHub e npm), `foundingDate` e `founder`.
- Traz também `disambiguatingDescription`: "It is not related to Laguna AI".
- **Vantagem:** consolida a marca como entidade no Knowledge Graph e evita confusão com um nome parecido.
- **Na ponta:** pode gerar painel de conhecimento e logo na SERP. As IAs não misturam a Lagune com a "Laguna AI" nas respostas.

**3.3 WebSite**, na home

- **Na ponta:** a SERP pode exibir o nome do site ("site name") em vez da URL.

**3.4 SoftwareApplication**, na home

- Traz `applicationCategory`, `offers` com preço 0, licença, `downloadUrl`, `softwareHelp` e uma `featureList` com 8 itens.
- **Vantagem:** descreve o produto de forma estruturada e marca que ele é gratuito.
- **Na ponta:** permite rich result de software. Quando alguém pergunta "ferramenta gratuita de hardening com IA", as IAs conseguem citar recursos concretos do produto.

**3.5 HowTo**, na home

- Os 5 passos (Charter, Detect, Plan, Harden, Verify), cada um com URL.
- **Na ponta:** o rich result visual de HowTo foi descontinuado pelo Google, mas a marcação continua útil para AEO. Assistentes e answer engines conseguem responder como usar o produto em passos numerados, com link para cada passo.

**3.6 FAQPage**, na home e automático em 26 docs pelo componente de FAQ

- **Vantagem:** perguntas e respostas prontas em formato de máquina. Esse é o núcleo do AEO.
- **Na ponta:** o rich result de FAQ hoje é restrito pelo Google a sites de governo e saúde. O maior ganho está em featured snippets, "As pessoas também perguntam", assistentes de voz e respostas de IA que extraem o par pergunta e resposta literalmente.

**3.7 BreadcrumbList**, em todas as docs e em `/share`

- **Na ponta:** a SERP mostra a trilha (Home > Docs > Página) no lugar da URL crua, o que traz mais contexto e mais CTR.

**3.8 TechArticle e ScholarlyArticle**, nas docs

- O paper metodológico é marcado como `ScholarlyArticle` e as demais docs como `TechArticle`. As marcações trazem autor, publisher, datas e `isPartOf`.
- **Na ponta:** sinaliza conteúdo técnico e acadêmico com autoria e datas, o que aumenta a confiabilidade para ranqueamento e para citação por IAs.

**3.9 WebPage**, em `/share`

- Usa `about` para apontar para o software e `significantLink` para o GitHub e o sponsor.
- **Na ponta:** liga a página ao grafo de entidades do produto.

---

## 4. GEO / LLMO

**4.1 `llms.txt`**, gerado no build

- Segue o padrão llms.txt: um resumo do produto e a lista de todas as docs, cada uma com link `.md` e descrição.
- **Vantagem:** a IA recebe um mapa curado do site, sem HTML, JS ou ruído.
- **Na ponta:** LLMs e agentes, como os de busca ou de código, entendem o produto e navegam pela doc de forma eficiente, o que deixa as citações mais precisas.

**4.2 `llms-full.txt`**

- Todo o corpus da documentação em um único arquivo.
- **Na ponta:** uma IA carrega a documentação inteira no contexto com uma única requisição. Isso é ideal para assistentes de código e para RAG.

**4.3 Twins Markdown por página**

- Cada doc é espelhada em Markdown limpo na própria URL com sufixo `.md`: imports são removidos, abas e admonitions viram texto e o FAQ vira H2/H3.
- Cada twin tem cabeçalho com `Canonical:` e `Last updated:`.
- **Na ponta:** a IA lê um conteúdo sem ruído, sabe qual é a URL oficial a citar e sabe a data. Isso diminui alucinação e garante a atribuição correta.

**4.4 `<link rel="alternate" type="text/markdown">`**, em todas as docs

- **Na ponta:** um crawler que chega pela versão HTML descobre automaticamente a versão Markdown da mesma página.

**4.5 Boas-vindas explícitas a robôs de IA** no `robots.txt`

- Liberação nominal para GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, CCBot, Amazonbot, Meta-ExternalAgent e cohere-ai.
- **Vantagem:** o site entra tanto no treinamento dos modelos quanto na busca em tempo real das IAs.
- **Na ponta:** o site pode aparecer e ser citado no ChatGPT Search, no Perplexity, no Claude, no Gemini e AI Overviews, e no Apple Intelligence.

**4.6 Conteúdo desenhado para citação**

- Inclui a desambiguação da entidade, o glossário com definições diretas, o paper metodológico, a comparação e frases-resumo autocontidas (por exemplo "works with 72 AI coding agents, needs no API key").
- **Na ponta:** as IAs extraem afirmações curtas, factuais e atribuíveis, que é o formato que mais aparece em respostas generativas.

**4.7 Descrições prontas para NLP parsing**, na Awesome You

- As descrições são escritas para leitura e interpretação por sistemas de busca, entre crawlers e NLP parsing, e se combinam com um sitemap.xml dinâmico, um schema JSON-LD estratégico e o padrão llms.txt.
- **Vantagem:** a máquina extrai entidades e relações do próprio texto, como o vínculo entre um projeto e seus mantenedores brasileiros.
- **Na ponta:** buscas como "Quais linguagens de programação foram criadas por brasileiros?" ou "Quais brasileiros fazem parte de X projeto?" retornam o projeto ligado às pessoas certas.

---

## 5. AEO

O AEO se apoia em abordagens já descritas, vistas aqui pelo papel que cumprem nos motores de resposta: a FAQPage e o FAQ renderizado com perguntas reais (3.6 e 4.3), o HowTo com passos numerados (3.5), as descrições autocontidas no frontmatter e na `featureList` (2.2 e 3.4) e os snippets sem limite de tamanho (1.2). Juntas, essas peças permitem que esses motores sirvam o conteúdo como resposta direta, sem exigir clique.

---

## 6. SMO (Open Graph e Twitter Cards)

- **Open Graph:** `og:type`, `og:site_name`, `og:locale`, `og:url`, `og:title` e `og:description`, mais `og:image` com `secure_url`, `width`/`height` (1280x640) e `alt` específico por página nas docs.
- **Twitter:** `twitter:card=summary_large_image` com título, descrição, imagem e `alt`.
- Uma imagem social padrão cobre as páginas sem imagem própria.
- **Na ponta:** o link compartilhado no X, LinkedIn, Slack, Discord ou WhatsApp vira um card grande com imagem, o que aumenta os cliques. As dimensões declaradas evitam que a plataforma recorte ou atrase o preview.
- **Página `/share` com QR code:** leva o público de eventos e apresentações direto ao repositório. Ela tem metadados sociais e schema próprios.

---

## 7. Performance e Core Web Vitals (sinal de ranqueamento)

**7.1 Critical CSS inline na home**

- As camadas CSS não usadas são removidas no build.
- **Na ponta:** melhora FCP e LCP, porque a primeira pintura acontece sem esperar o CSS completo.

**7.2 Drop de fontes WOFF**

- Só o WOFF2 é publicado.
- **Na ponta:** a stylesheet que bloqueia a renderização fica menor e a pintura acontece mais rápido.

**7.3 Imagens responsivas**

- WebP com `srcset` (480, 720 e 912), `fetchpriority="high"` e `loading="eager"` na imagem ativa, carregamento adiado e de baixa prioridade nas demais, e `decoding="async"`.
- **Na ponta:** melhora o LCP, reduz o consumo de dados no celular e deixa a experiência mobile mais leve.

**7.4 Shader pesado isolado**

- O shader de água da home carrega sob demanda, só no navegador, e roda em um worker com OffscreenCanvas.
- **Na ponta:** a thread principal fica livre, o que ajuda o INP e o TBT. O efeito visual também fica fora do HTML pré-renderizado.

**7.5 Cache HTTP agressivo**

- Assets têm cache imutável de 1 ano, imagens de 30 dias e HTML de 1 hora.
- **Na ponta:** visitas recorrentes carregam quase instantaneamente, o HTML se mantém atualizado e o robô rastreia com menos custo.

**7.6 Site estático pré-renderizado (SSG)**

- **Na ponta:** todo o conteúdo e o JSON-LD já estão no HTML, então robôs que não executam JavaScript (a maioria dos robôs de IA) leem tudo.

---

## Glossário

- **AEO (Answer Engine Optimization):** otimização para motores de resposta, que entregam a informação pronta em vez de uma lista de links.
- **CTR (Click-Through Rate):** taxa de cliques, a proporção entre quem vê um link e quem clica nele.
- **E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness):** experiência, especialidade, autoridade e confiança, os critérios que o Google usa para avaliar a qualidade de um conteúdo.
- **FAQ (Frequently Asked Questions):** perguntas frequentes.
- **FCP (First Contentful Paint):** tempo até o primeiro conteúdo aparecer na tela.
- **GEO (Generative Engine Optimization):** otimização para motores generativos, as IAs que respondem gerando texto, como o ChatGPT e o Perplexity.
- **INP (Interaction to Next Paint):** tempo entre uma interação do usuário e a próxima atualização visual da página.
- **JSON-LD (JavaScript Object Notation for Linked Data):** JSON para dados interligados, o formato com que o Schema.org é embutido nas páginas.
- **LCP (Largest Contentful Paint):** tempo até o maior elemento visível terminar de renderizar.
- **LLM (Large Language Model):** modelo de linguagem de grande porte, a tecnologia por trás de IAs como o ChatGPT e o Claude.
- **LLMO (Large Language Model Optimization):** otimização voltada a LLMs, tratada neste estudo como equivalente ao GEO.
- **NLP (Natural Language Processing):** processamento de linguagem natural, a técnica com que a máquina lê e interpreta texto humano.
- **QR code (Quick Response code):** código bidimensional que a câmera lê para abrir um link.
- **RAG (Retrieval-Augmented Generation):** geração aumentada por recuperação, em que a IA busca documentos relevantes antes de escrever a resposta.
- **SEO (Search Engine Optimization):** otimização para mecanismos de busca tradicionais, como o Google.
- **SERP (Search Engine Results Page):** a página de resultados do buscador.
- **SMO (Social Media Optimization):** otimização para o compartilhamento em redes sociais.
- **SSG (Static Site Generation):** geração de site estático, com todas as páginas prontas no build.
- **TBT (Total Blocking Time):** tempo total em que a thread principal fica bloqueada durante o carregamento.
- **TOC (Table of Contents):** o sumário da página.
- **WOFF e WOFF2 (Web Open Font Format):** formato de fonte para a web. O WOFF2 é a versão com melhor compressão.
