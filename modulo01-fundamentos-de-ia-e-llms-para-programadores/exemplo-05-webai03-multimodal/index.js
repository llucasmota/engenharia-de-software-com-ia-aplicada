import { AIService } from './services/aiService.js';
import { TranslationService } from './services/translationService.js';
import { View } from './views/view.js';
import { FormController } from './controllers/formController.js';

(async function main() {
    // Initialize services and view
    const aiService = new AIService();
    const translationService = new TranslationService();
    const view = new View();

    // Set current year
    view.setYear();

    // Check requirements
    const errors = await aiService.checkRequirements();
    if (errors) {
        view.showError(errors);
        return;
    }

    // Fase 1: verificar disponibilidade da tradução (sem gesto do usuário)
    // O create() / download do modelo ocorre na fase 2, dentro do gesto do submit
    const translationWarnings = await translationService.checkAvailability();
    if (translationWarnings) {
        console.info('Translation availability warnings:', translationWarnings);
        // São avisos informativos, não erros fatais — a app continua funcionando
        view.showWarnings(translationWarnings);
    }

    // Get and initialize AI parameters
    const params = await aiService.getParams();
    view.initializeParameters(params);

    // Initialize controller and setup event listeners
    const controller = new FormController(aiService, translationService, view);
    controller.setupEventListeners();

    console.log('Application initialized successfully');
})();
