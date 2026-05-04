import Constants from 'expo-constants';
import type {
  ChatMessage,
  ChatSessionContext,
  ChatbotConfig,
  ChatbotFallback,
  ChatbotResult,
  KnowledgeBaseEntry,
} from 'src/@types/chatbot.types';
import { createKnowledgeBaseRetriever, type KnowledgeBaseMatch } from './chatbot/retriever';
import { getSocialResponse } from './chatbot/socialIntents';

const MAX_INPUT_LENGTH = 600;
const RETRIEVER_TOP_K = 3;
const RETRIEVER_MIN_SCORE = 2.2;
const RETRIEVER_MIN_COVERAGE = 0.2;

const knowledgeBase = (require('../data/chatbot/kb.driver.json') as KnowledgeBaseEntry[]).filter(
  (entry) => entry.role === 'driver',
);
const knowledgeBaseRetriever = createKnowledgeBaseRetriever(knowledgeBase);

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

function getEnvVar(key: string): string {
  const env = ((globalThis as any)?.process?.env ?? {}) as Record<string, string | undefined>;
  return String(env[key] ?? '').trim();
}

function toTimeoutMs(value: string | number | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function buildGeminiUrl(config: ChatbotConfig): string {
  const baseUrl = config.baseUrl.replace(/\/+$/, '');
  const model = config.model.replace(/^models\//, '');

  if (baseUrl.includes(':generateContent')) {
    return baseUrl;
  }

  if (baseUrl.endsWith('/models')) {
    return `${baseUrl}/${model}:generateContent`;
  }

  return `${baseUrl}/models/${model}:generateContent`;
}

function getConfig(): ChatbotConfig {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | number | undefined>;
  const apiKey = getEnvVar('EXPO_PUBLIC_LLM_API_KEY') || String(extra.llmApiKey ?? '').trim();

  if (!apiKey) {
    throw new ChatbotServiceError(
      'Chave da IA nao configurada. Defina EXPO_PUBLIC_LLM_API_KEY.',
      'missing_api_key',
    );
  }

  const model = getEnvVar('EXPO_PUBLIC_LLM_MODEL') || String(extra.llmModel ?? 'gemini-1.5-flash').trim();
  const baseUrl =
    getEnvVar('EXPO_PUBLIC_LLM_BASE_URL') ||
    String(extra.llmBaseUrl ?? 'https://generativelanguage.googleapis.com/v1beta').trim();
  const timeoutMs = toTimeoutMs(getEnvVar('EXPO_PUBLIC_LLM_TIMEOUT_MS') || extra.llmTimeoutMs, 12000);

  return {
    apiKey,
    model,
    baseUrl,
    supportLabel: String(extra.supportLabel ?? (getEnvVar('EXPO_PUBLIC_SUPPORT_LABEL') || 'Falar com suporte')).trim(),
    supportUrl: String(extra.supportUrl ?? (getEnvVar('EXPO_PUBLIC_SUPPORT_URL') || 'mailto:suporte@rodaki.app')).trim(),
    timeoutMs,
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
    'Saudacoes e cortesias simples podem ser respondidas diretamente, sem fallback.',
    'Responda apenas com base na base de conhecimento fornecida.',
    'Se a pergunta estiver fora de escopo ou sem confianca, inicie a resposta com [FALLBACK].',
    'Quando estiver em escopo, forneca passos praticos com base no uso do app.',
  ].join(' ');
}

function buildKnowledgeContext(matches: KnowledgeBaseMatch[]): string {
  if (!matches.length) return 'Sem itens relevantes.';

  return matches
    .map((match, index) => {
      const question = match.entry.question.trim();
      const answer = match.entry.answer.trim();
      return `Item ${index + 1}\nPergunta: ${question}\nResposta: ${answer}`;
    })
    .join('\n\n');
}

function buildUserPrompt(message: string, matches: KnowledgeBaseMatch[]): string {
  return [
    `Pergunta do usuario: ${message}`,
    'Base de conhecimento (use somente estas informacoes):',
    buildKnowledgeContext(matches),
    'Se nao houver resposta clara na base, inicie com [FALLBACK].',
  ].join('\n');
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
  matches: KnowledgeBaseMatch[],
): Promise<ChatbotResult> {
  const url = buildGeminiUrl(config);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const userPrompt = buildUserPrompt(message, matches);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: getSystemPrompt(context) }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const providerMessage = String(data?.error?.message ?? '').trim();
      if (response.status === 401 || response.status === 403) {
        throw new ChatbotServiceError(
          providerMessage || 'Falha de autenticacao no provedor da IA',
          'invalid_api_key',
        );
      }
      if (response.status === 400) {
        const code = /model/i.test(providerMessage) ? 'invalid_model' : 'invalid_request';
        throw new ChatbotServiceError(providerMessage || 'Requisicao invalida para o provedor da IA', code);
      }
      throw new ChatbotServiceError(
        providerMessage || `Erro do provedor (${response.status})`,
        'provider_http_error',
      );
    }

    const finishReason = String(data?.candidates?.[0]?.finishReason ?? '').toUpperCase();
    const blockReason = String(data?.promptFeedback?.blockReason ?? '').toUpperCase();
    if (finishReason === 'SAFETY' || !!blockReason) {
      throw new ChatbotServiceError('Resposta bloqueada por seguranca do provedor da IA', 'safety_blocked');
    }

    const parts = data?.candidates?.[0]?.content?.parts;
    const content = Array.isArray(parts)
      ? parts
          .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
          .join('\n')
          .trim()
      : '';

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

    const socialResponse = getSocialResponse(input);
    if (socialResponse) {
      return { message: createMessage('assistant', socialResponse) };
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
      if (!knowledgeBase.length) {
        const fallback = toFallback(
          config,
          'configuration_error',
          'A base de conhecimento nao esta configurada. Fale com o suporte.',
        );
        return { message: createMessage('assistant', fallback.description, fallback), fallback };
      }

      const matches = knowledgeBaseRetriever.search(input, { topK: RETRIEVER_TOP_K });
      const bestMatch = matches[0];

      if (!bestMatch || bestMatch.score < RETRIEVER_MIN_SCORE || bestMatch.coverage < RETRIEVER_MIN_COVERAGE) {
        if (__DEV__) {
          console.info('chatbot.no_match', {
            question: input,
            score: bestMatch?.score ?? 0,
            coverage: bestMatch?.coverage ?? 0,
          });
        }

        const fallback = toFallback(
          config,
          'low_confidence',
          'Nao encontrei uma resposta confiavel na base de conhecimento. Posso direcionar voce ao suporte.',
        );

        return { message: createMessage('assistant', fallback.description, fallback), fallback };
      }

      return await requestCompletion(config, context, input.trim(), matches);
    } catch (error: any) {
      const isNetworkError = error?.code === 'network_error' || error?.code === 'timeout';
      const reason: ChatbotFallback['reason'] = isNetworkError ? 'network_error' : 'provider_error';

      let description = 'Nao consegui processar sua mensagem agora. Tente novamente em instantes ou fale com o suporte.';
      if (error?.code === 'invalid_api_key') {
        description = 'Nao foi possivel autenticar no servico de IA. Verifique a chave configurada no app.';
      } else if (error?.code === 'invalid_model' || error?.code === 'invalid_request') {
        description = 'A configuracao da IA esta invalida. Revise modelo e endpoint da integracao.';
      } else if (error?.code === 'timeout') {
        description = 'A resposta da IA demorou demais. Tente novamente em instantes.';
      } else if (error?.code === 'network_error') {
        description = 'Falha de conexao ao consultar a IA. Verifique sua internet e tente novamente.';
      }

      const fallback = toFallback(config, reason, description);

      return {
        message: createMessage('assistant', fallback.description, fallback),
        fallback,
      };
    }
  },
};

export { ChatbotServiceError };
