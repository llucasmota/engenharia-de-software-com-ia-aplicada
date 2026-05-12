export class TranslationService {
    constructor() {
        this.translator = null;
        this.languageDetector = null;
        this._initPromise = null;
        this.translatorAvailability = null;
        this.detectorAvailability = null;
    }

    /**
     * Fase 1 — pode ser chamada no carregamento da página, sem gesto do usuário.
     * Verifica a disponibilidade das APIs sem tentar criar/baixar nada.
     * Retorna um array de avisos ou null se tudo estiver pronto.
     */
    async checkAvailability() {
        const warnings = [];

        if (!('Translator' in self)) {
            warnings.push('⚠️ A API de Tradução não está disponível neste browser.');
        } else {
            this.translatorAvailability = await Translator.availability({
                sourceLanguage: 'en',
                targetLanguage: 'pt',
            });
            console.log('Translator availability:', this.translatorAvailability);

            if (this.translatorAvailability === 'no') {
                warnings.push('⚠️ Tradução (en→pt) não é suportada neste dispositivo.');
            } else if (this.translatorAvailability === 'downloading') {
                warnings.push('ℹ️ O modelo de tradução está sendo baixado em segundo plano. A tradução será ativada automaticamente após o download.');
            } else if (this.translatorAvailability === 'downloadable') {
                warnings.push('ℹ️ O modelo de tradução será baixado ao enviar a primeira pergunta.');
            }
        }

        if (!('LanguageDetector' in self)) {
            warnings.push('⚠️ A API de Detecção de Idioma não está disponível.');
        } else {
            this.detectorAvailability = await LanguageDetector.availability();
            console.log('LanguageDetector availability:', this.detectorAvailability);
        }

        return warnings.length > 0 ? warnings : null;
    }

    /**
     * Fase 2 — deve ser chamada dentro de um gesto do usuário (ex: submit do form).
     * Realiza o create() e, se necessário, aguarda o download do modelo.
     * Idempotente: chamadas consecutivas reutilizam a mesma Promise.
     */
    async initialize() {
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            try {
                if ('Translator' in self && this.translatorAvailability !== 'no') {
                    console.log('Initializing Translator...');
                    this.translator = await Translator.create({
                        sourceLanguage: 'en',
                        targetLanguage: 'pt',
                        monitor(m) {
                            m.addEventListener('downloadprogress', (e) => {
                                const percent = ((e.loaded / e.total) * 100).toFixed(0);
                                console.log(`Translator downloaded ${percent}%`);
                            });
                        }
                    });
                    console.log('Translator ready.');
                }

                if ('LanguageDetector' in self && this.detectorAvailability !== 'no') {
                    console.log('Initializing LanguageDetector...');
                    this.languageDetector = await LanguageDetector.create({
                        monitor(m) {
                            m.addEventListener('downloadprogress', (e) => {
                                const percent = ((e.loaded / e.total) * 100).toFixed(0);
                                console.log(`LanguageDetector downloaded ${percent}%`);
                            });
                        }
                    });
                    console.log('LanguageDetector ready.');
                }

                return true;
            } catch (error) {
                // Resetar para permitir nova tentativa
                this._initPromise = null;
                console.error('Error initializing translation services:', error);
                throw new Error(`⚠️ Erro ao inicializar APIs de tradução: ${error.message}`);
            }
        })();

        return this._initPromise;
    }

    /** Indica se os serviços já estão prontos para uso. */
    isReady() {
        return this.translator !== null;
    }

    async translateToPortuguese(text) {
        // Inicialização lazy: garante que o create() foi chamado dentro do gesto
        if (!this.translator) {
            try {
                await this.initialize();
            } catch (error) {
                console.warn('Translation unavailable, returning original text:', error.message);
                return text;
            }
        }

        if (!this.translator) {
            console.warn('Translator not available, returning original text');
            return text;
        }

        try {
            // Detect language first
            if (this.languageDetector) {
                const detectionResults = await this.languageDetector.detect(text);
                console.log('Detected languages:', detectionResults);

                // If already in Portuguese, no need to translate
                if (detectionResults && detectionResults[0]?.detectedLanguage === 'pt') {
                    console.log('Text is already in Portuguese');
                    return text;
                }
            }

            // Use streaming translation
            const stream = this.translator.translateStreaming(text);
            let translated = '';
            for await (const chunk of stream) {
                translated = chunk; // Each chunk is the full translation so far
            }
            console.log('Translated text:', translated);
            return translated;
        } catch (error) {
            console.error('Translation error:', error);
            return text; // Return original text if translation fails
        }
    }
}
