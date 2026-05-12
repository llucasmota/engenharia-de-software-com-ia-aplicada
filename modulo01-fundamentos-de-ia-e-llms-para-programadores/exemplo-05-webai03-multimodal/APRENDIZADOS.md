# Aprendizados: Chrome Built-in AI APIs — Problemas e Soluções

Este documento registra os problemas encontrados ao integrar as **Chrome Built-in AI APIs**
(Translator, LanguageDetector, LanguageModel) neste projeto, as causas raiz de cada erro
e o raciocínio por trás de cada solução aplicada.

---

## Problema 1 — `NotAllowedError: Requires a user gesture when availability is "downloading" or "downloadable"`

**Arquivo:** `services/translationService.js` (linha 26, no `catch` do `initialize()`)

### O que acontecia

Ao carregar a página, o `index.js` chamava `translationService.initialize()` diretamente
no `main()` assíncrono automático:

```js
// index.js (código antigo)
(async function main() {
    // ...
    await translationService.initialize(); // ← chamado sem gesto do usuário
})();
```

Dentro de `initialize()`, havia uma chamada a `Translator.create()`:

```js
// translationService.js (código antigo)
async initialize() {
    this.translator = await Translator.create({ ... }); // ← lança o erro
}
```

### Por que isso dá erro?

As Chrome Built-in AI APIs seguem uma **política de segurança do browser**: operações que
envolvem **download de modelos de IA** só podem ser iniciadas a partir de um **gesto explícito
do usuário** (clique, pressionamento de tecla, submit de formulário, etc.).

Isso existe por dois motivos principais:

1. **Privacidade e controle:** O usuário deve saber e "consentir" (mesmo que implicitamente)
   que um modelo de IA está sendo baixado para seu dispositivo.
2. **Prevenção de abuso:** Evitar que sites iniciem downloads pesados de forma silenciosa
   e automática ao carregar a página.

Quando o modelo ainda não está no dispositivo (`"downloadable"`) ou está sendo baixado
(`"downloading"`), o `create()` precisa aguardar ou acionar esse download — e isso
**só é permitido dentro de um evento de interação do usuário**.

> [!IMPORTANT]
> A chamada `.availability()` **não** requer gesto do usuário — ela apenas consulta o estado atual.
> Somente `.create()` (que pode disparar download) exige o gesto.

### Solução aplicada: Inicialização em 2 fases

A solução foi separar o ciclo de vida do serviço em duas fases bem definidas:

```
Fase 1: checkAvailability()   ← segura, chamada no carregamento da página
Fase 2: initialize()          ← chamada apenas dentro de um gesto do usuário
```

#### Fase 1 — `checkAvailability()` (sem gesto necessário)

```js
async checkAvailability() {
    // Apenas consulta — nunca faz download
    this.translatorAvailability = await Translator.availability({
        sourceLanguage: 'en',
        targetLanguage: 'pt',
    });
    this.detectorAvailability = await LanguageDetector.availability();
    // Retorna avisos informativos, mas não bloqueia a app
}
```

Chamada no `main()` do `index.js`, substitui o antigo `initialize()`:

```js
// index.js (novo)
const translationWarnings = await translationService.checkAvailability();
if (translationWarnings) {
    view.showWarnings(translationWarnings); // avisa, mas não bloqueia
}
```

#### Fase 2 — `initialize()` (dentro do gesto do usuário)

```js
async initialize() {
    if (this._initPromise) return this._initPromise; // idempotente

    this._initPromise = (async () => {
        this.translator = await Translator.create({ ... }); // ← agora seguro
        this.languageDetector = await LanguageDetector.create({ ... });
    })();

    return this._initPromise;
}
```

#### Inicialização lazy em `translateToPortuguese()`

Como `translateToPortuguese()` sempre é chamado a partir do submit do formulário (gesto do
usuário), ele agora aciona o `initialize()` automaticamente na primeira execução:

```js
async translateToPortuguese(text) {
    if (!this.translator) {
        await this.initialize(); // ← dentro do gesto, seguro
    }
    // ...
}
```

**Por que `_initPromise`?** Para garantir que, mesmo que `translateToPortuguese()` seja
chamado múltiplas vezes rapidamente (race condition), o `Translator.create()` seja executado
**uma única vez**. Se falhar, `_initPromise` é resetado para permitir nova tentativa.

---

## Problema 2 — `NotAllowedError: Model capability is not available`

**Arquivo:** `controllers/formController.js` (linha 87, no `catch` do `handleSubmit()`)

### O que acontecia

O erro vinha de dentro de `aiService.createSession()`, especificamente do `LanguageModel.create()`:

```js
// aiService.js (código antigo)
this.session = await LanguageModel.create({
    expectedInputs: [
        { type: "text", languages: ["en"] },
        { type: "audio" },   // ← sempre solicitado
        { type: "image" },   // ← sempre solicitado
    ],
    // ...
});
```

### Por que isso dá erro?

O Gemini Nano embutido no Chrome é um modelo de linguagem de **tamanho reduzido**, pensado
para rodar localmente no dispositivo. Suporte a entradas multimodais (`image`, `audio`) é uma
feature **experimental e ainda instável**, disponível apenas em versões muito recentes do
Chrome Canary e condicionada a flags específicas.

Quando você declara `expectedInputs` com `audio` ou `image` e o modelo **não tem essa
capacidade habilitada**, o Chrome lança `NotAllowedError: Model capability is not available`.

> [!WARNING]
> Solicitar uma capacidade não suportada em `expectedInputs` falha **toda** a criação da sessão,
> mesmo que você queira usar só texto. O erro não é "parcial".

### Solução aplicada: verificação dinâmica de capacidades

Antes de criar a sessão, o código agora consulta o que está disponível naquele
dispositivo/versão do Chrome:

```js
// aiService.js (novo)
const expectedInputs = [{ type: "text", languages: ["en"] }];

const checkCapability = async (type) => {
    try {
        const av = await LanguageModel.availability({ expectedInputs: [{ type }] });
        return av !== 'no' && av !== 'unavailable';
    } catch {
        return false; // se a API não reconhece o tipo, não suporta
    }
};

if (file) {
    const fileType = file.type.split('/')[0]; // 'image' ou 'audio'
    if (await checkCapability(fileType)) {
        expectedInputs.push({ type: fileType }); // só adiciona se suportado
    } else {
        console.warn(`Capacidade "${fileType}" não disponível. Arquivo ignorado.`);
        file = null;
    }
}

this.session = await LanguageModel.create({ expectedInputs, ... });
```

**Por que só verificar quando há um arquivo?** Porque pedir `text` sempre funciona.
O problema só ocorre ao solicitar `image` ou `audio` — e só faz sentido incluí-los se
o usuário anexou um arquivo desse tipo.

---

## Mudanças auxiliares

### `view.js` — Separação entre erros fatais e avisos

Para comunicar o estado das APIs ao usuário sem bloquear a interação:

```js
// Erro fatal — desabilita o botão (ex: LanguageModel não disponível)
showError(errors) {
    this.elements.output.innerHTML = errors.join('<br/>');
    this.elements.button.disabled = true;
}

// Aviso informativo — app continua funcionando (ex: modelo sendo baixado)
showWarnings(warnings) {
    this.elements.output.innerHTML = warnings.join('<br/>');
    // botão NÃO é desabilitado
}
```

---

## Padrões aprendidos

| Padrão | Aplicação |
|--------|-----------|
| **Feature Detection** | Sempre verificar `'Translator' in self` antes de usar a API |
| **Capability Check** | Usar `.availability()` antes de `.create()` para mapear o que está disponível |
| **Lazy Initialization** | Adiar inicializações que requerem gesto para o momento do uso real |
| **Idempotência com Promise** | Usar `_initPromise` para evitar múltiplas inicializações em paralelo |
| **Graceful Degradation** | Se uma capacidade não está disponível, continuar com as que estão (ex: sem arquivo) |
| **Feedback separado por severidade** | Distinguir erros fatais de avisos informativos na UI |

---

## Referências

- [Chrome AI APIs — Translator API](https://developer.chrome.com/docs/ai/translator-api)
- [Chrome AI APIs — Language Detection API](https://developer.chrome.com/docs/ai/language-detection)
- [Chrome AI APIs — Prompt API (LanguageModel)](https://developer.chrome.com/docs/ai/prompt-api)
- [Política de gesto do usuário no browser](https://html.spec.whatwg.org/multipage/interaction.html#tracking-user-activation)
