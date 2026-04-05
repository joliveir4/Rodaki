import Constants from 'expo-constants';
import type {
  ChatMessage,
  ChatSessionContext,
  ChatbotConfig,
  ChatbotFallback,
  ChatbotResult,
} from 'src/@types/chatbot.types';

const MAX_INPUT_LENGTH = 600;

class ChatbotServiceError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ChatbotServiceError';
  }
}

const chatbotContext = {
  capabilities: [
    'explicar como usar funcionalidades do aplicativo Rodaki',
    'orientar sobre fluxo de pagamento e comprovante',
    'responder perguntas de conta, acesso e navegacao no app',
  ],
  restrictions: [
    'nao responder sobre temas fora do aplicativo Rodaki',
    'nao fornecer aconselhamento medico, legal, financeiro ou tecnico externo',
    'nao inventar recursos que nao existem no app',
  ],
};

const fallbackBaseText =
  'Nao consegui ajudar com seguranca nessa pergunta. Posso direcionar voce para o suporte humano da Rodaki.';

function getConfig(): ChatbotConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | number | undefined>;
  const apiKey = String(extra.llmApiKey ?? '').trim();

  if (!apiKey) {
    throw new ChatbotServiceError(
      'Chave da IA nao configurada. Defina expo.extra.llmApiKey.',
      'missing_api_key',
    );
  }

  return {
    apiKey,
    model: String(extra.llmModel ?? 'llama-3.1-8b-instant').trim(),
    baseUrl: String(extra.llmBaseUrl ?? 'https://api.groq.com/openai/v1/chat/completions').trim(),
    supportLabel: String(extra.supportLabel ?? 'Falar com suporte').trim(),
    supportUrl: String(extra.supportUrl ?? 'mailto:suporte@rodaki.app').trim(),
    timeoutMs: Number(extra.llmTimeoutMs ?? 12000),
  };
}

function createMessage(sender: ChatMessage['sender'], text: string, fallback?: ChatbotFallback): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    text,
    createdAt: new Date(),
    fallback,
  };
}

function toFallback(
  config: ChatbotConfig,
  reason: ChatbotFallback['reason'],
  description?: string,
): ChatbotFallback {
  return {
    reason,
    title: 'Encaminhamento para suporte',
    description: description ?? fallbackBaseText,
    ctaLabel: config.supportLabel,
    ctaUrl: config.supportUrl,
  };
}

function getSystemPrompt(context: ChatSessionContext): string {
  return [
    'Voce e um assistente de suporte do aplicativo Rodaki.',
    `Usuario atual: ${context.userName ?? 'usuario'}, perfil ${context.userRole}.`,
    'Responda em portugues do Brasil, de forma objetiva e amigavel.',
    `Escopo permitido: ${chatbotContext.capabilities.join('; ')}.`,
    `Escopo proibido: ${chatbotContext.restrictions.join('; ')}.`,
    'Se a pergunta estiver fora de escopo ou sem confianca, inicie a resposta com [FALLBACK].',
    'Quando estiver em escopo, forneca passos praticos com base no uso do app.',
  ].join(' ');
}

function parseProviderText(rawText: string, config: ChatbotConfig): ChatbotResult {
  const text = rawText.trim();

  if (text.startsWith('[FALLBACK]')) {
    const clean = text.replace('[FALLBACK]', '').trim() || fallbackBaseText;
    const fallback = toFallback(config, 'out_of_scope', clean);
    return {
      message: createMessage('assistant', clean, fallback),
      fallback,
    };
  }

  return {
    message: createMessage('assistant', text),
  };
}

async function requestCompletion(
  config: ChatbotConfig,
  context: ChatSessionContext,
  message: string,
): Promise<ChatbotResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: getSystemPrompt(context) },
          { role: 'user', content: message },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ChatbotServiceError(`Erro do provedor (${response.status})`, 'provider_http_error');
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      throw new ChatbotServiceError('Resposta vazia do provedor', 'invalid_provider_response');
    }

    return parseProviderText(content, config);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ChatbotServiceError('Tempo limite da IA excedido', 'timeout');
    }
    if (error instanceof ChatbotServiceError) {
      throw error;
    }
    throw new ChatbotServiceError('Falha de rede ao consultar a IA', 'network_error');
  } finally {
    clearTimeout(timer);
  }
}

export const chatbotService = {
  createWelcomeMessage(role: ChatSessionContext['userRole']): ChatMessage {
    const text =
      role === 'driver'
        ? 'Oi! Sou o assistente da Rodaki. Posso ajudar com navegacao no app, fluxo de pagamentos e FAQs da conta.'
        : 'Oi! Sou o assistente da Rodaki. Posso ajudar com pagamentos, navegacao no app e duvidas da sua conta.';

    return createMessage('assistant', text);
  },

  createUserMessage(input: string): ChatMessage {
    return createMessage('user', input.trim());
  },

  validateInput(input: string): string | null {
    if (!input.trim()) return 'Digite uma pergunta para enviar.';
    if (input.trim().length > MAX_INPUT_LENGTH) {
      return `Sua mensagem esta muito longa. Limite de ${MAX_INPUT_LENGTH} caracteres.`;
    }
    return null;
  },

  async sendMessage(context: ChatSessionContext, input: string): Promise<ChatbotResult> {
    const validationError = chatbotService.validateInput(input);
    if (validationError) {
      throw new ChatbotServiceError(validationError, 'invalid_input');
    }

    let config: ChatbotConfig;
    try {
      config = getConfig();
    } catch {
      const fallbackConfig = {
        apiKey: '',
        model: '',
        baseUrl: '',
        supportLabel: 'Falar com suporte',
        supportUrl: 'mailto:suporte@rodaki.app',
        timeoutMs: 0,
      };
      const fallback = toFallback(
        fallbackConfig,
        'configuration_error',
        'A IA ainda nao esta configurada no app. Use o suporte para atendimento.',
      );
      return { message: createMessage('assistant', fallback.description, fallback), fallback };
    }

    try {
      return await requestCompletion(config, context, input.trim());
    } catch (error: any) {
      const reason: ChatbotFallback['reason'] =
        error?.code === 'network_error' || error?.code === 'timeout' ? 'network_error' : 'provider_error';

      const fallback = toFallback(
        config,
        reason,
        'Nao consegui processar sua mensagem agora. Tente novamente em instantes ou fale com o suporte.',
      );

      return {
        message: createMessage('assistant', fallback.description, fallback),
        fallback,
      };
    }
  },
};

export { ChatbotServiceError };
