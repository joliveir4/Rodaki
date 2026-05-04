const DOMAIN_BLOCKLIST = new Set([
  'pagamento',
  'pagamentos',
  'comprovante',
  'recibo',
  'viagem',
  'viagens',
  'cadastro',
  'conta',
  'app',
  'motorista',
  'passageiro',
  'saldo',
  'taxa',
  'pix',
  'dinheiro',
]);

const GREETING_PATTERNS = [
  /^oi+$/,
  /^ola+$/,
  /^opa$/,
  /^eai+$/,
  /^eae+$/,
  /^bom dia$/,
  /^boa tarde$/,
  /^boa noite$/,
];

const SMALLTALK_PATTERNS = [
  /^tudo bem\??$/,
  /^como vai\??$/,
  /^como voce esta\??$/,
  /^tudo certo\??$/,
  /^e voce\??$/,
];

const THANKS_PATTERNS = [
  /^obrigado$/,
  /^obrigada$/,
  /^muito obrigado$/,
  /^muito obrigada$/,
  /^valeu$/,
  /^brigado$/,
  /^brigada$/,
  /^agradecido$/,
  /^agradecida$/,
];

const FAREWELL_PATTERNS = [
  /^tchau$/,
  /^ate logo$/,
  /^ate mais$/,
  /^ate breve$/,
  /^ate$/,
  /^falou$/,
];

const ACK_PATTERNS = [
  /^ok$/,
  /^blz$/,
  /^beleza$/,
  /^certo$/,
  /^entendido$/,
  /^perfeito$/,
  /^show$/,
];

const RESPONSES = {
  greeting: [
    'Ola! Como posso ajudar voce hoje? 🙂',
    'Oi! Em que posso ajudar no app Rodaki?',
    'Ola! Estou por aqui para ajudar com o Rodaki.',
  ],
  smalltalk: [
    'Tudo bem por aqui! Como posso ajudar no Rodaki? 🙂',
    'Estou bem, obrigado! Em que posso ajudar no app?',
    'Tudo certo! Quer ajuda com alguma funcao do Rodaki?',
  ],
  thanks: [
    'De nada! Se precisar, estou por aqui. 🙂',
    'Imagina! Quer ajuda com mais alguma coisa?',
    'Disponha! Se surgir outra duvida, me chame.',
  ],
  farewell: [
    'Ate mais! Se precisar, estou por aqui. 🙂',
    'Tchau! Conte comigo quando precisar.',
    'Ate logo! Posso ajudar em algo mais?',
  ],
  ack: [
    'Perfeito! Se precisar, continuo por aqui. 🙂',
    'Certo! Quer seguir com alguma duvida do app?',
    'Beleza! Posso ajudar com algo do Rodaki?',
  ],
} as const;

type SocialIntent = keyof typeof RESPONSES;

function normalizeText(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasDomainToken(tokens: string[]): boolean {
  return tokens.some((token) => DOMAIN_BLOCKLIST.has(token));
}

function matchesAny(normalized: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(normalized));
}

function pickRandomResponse(intent: SocialIntent): string {
  const pool = RESPONSES[intent];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function getSocialResponse(input: string): string | null {
  const normalized = normalizeText(input);
  if (!normalized) return null;

  const tokens = normalized.split(' ');
  if (tokens.length > 6) return null;
  if (hasDomainToken(tokens)) return null;

  if (matchesAny(normalized, SMALLTALK_PATTERNS)) {
    return pickRandomResponse('smalltalk');
  }

  if (matchesAny(normalized, GREETING_PATTERNS)) {
    return pickRandomResponse('greeting');
  }

  if (matchesAny(normalized, THANKS_PATTERNS)) {
    return pickRandomResponse('thanks');
  }

  if (matchesAny(normalized, FAREWELL_PATTERNS)) {
    return pickRandomResponse('farewell');
  }

  if (matchesAny(normalized, ACK_PATTERNS)) {
    return pickRandomResponse('ack');
  }

  return null;
}
