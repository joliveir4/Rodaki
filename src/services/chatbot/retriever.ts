import type { KnowledgeBaseEntry } from '@types/chatbot.types';

export interface KnowledgeBaseMatch {
  entry: KnowledgeBaseEntry;
  score: number;
  coverage: number;
}

export interface KnowledgeBaseSearchOptions {
  topK?: number;
}

const STOPWORDS = new Set([
  'a',
  'o',
  'e',
  'de',
  'da',
  'do',
  'das',
  'dos',
  'na',
  'no',
  'nas',
  'nos',
  'um',
  'uma',
  'para',
  'com',
  'que',
  'como',
  'por',
  'se',
  'ao',
  'aos',
  'as',
  'os',
  'em',
  'nao',
  'sim',
]);

const DOMAIN_TOKENS = new Set([
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

interface IndexedEntry {
  entry: KnowledgeBaseEntry;
  tokens: string[];
  tokenSet: Set<string>;
  normalizedText: string;
}

function normalizeText(text: string): string {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function buildIndex(entries: KnowledgeBaseEntry[]) {
  const indexed: IndexedEntry[] = entries.map((entry) => {
    const combined = [entry.question, entry.answer, ...(entry.tags ?? [])].join(' ');
    const normalized = normalizeText(combined);
    const tokens = tokenize(normalized);
    return {
      entry,
      tokens,
      tokenSet: new Set(tokens),
      normalizedText: normalized,
    };
  });

  const df = new Map<string, number>();
  indexed.forEach((item) => {
    const unique = new Set(item.tokens);
    unique.forEach((token) => {
      df.set(token, (df.get(token) ?? 0) + 1);
    });
  });

  const total = indexed.length || 1;
  const idf = new Map<string, number>();
  df.forEach((count, token) => {
    const value = Math.log((total + 1) / (count + 1)) + 1;
    idf.set(token, value);
  });

  return { indexed, idf };
}

export function createKnowledgeBaseRetriever(entries: KnowledgeBaseEntry[]) {
  const { indexed, idf } = buildIndex(entries);

  function search(question: string, options: KnowledgeBaseSearchOptions = {}): KnowledgeBaseMatch[] {
    const normalizedQuestion = normalizeText(question);
    const queryTokens = tokenize(normalizedQuestion);
    const queryTokenSet = new Set(queryTokens);

    if (!queryTokens.length) return [];

    const matches: KnowledgeBaseMatch[] = indexed
      .map((item) => {
        let score = 0;
        let matchedTokens = 0;

        queryTokenSet.forEach((token) => {
          if (item.tokenSet.has(token)) {
            matchedTokens += 1;
            score += idf.get(token) ?? 1;
            if (DOMAIN_TOKENS.has(token)) {
              score += 0.4;
            }
          }
        });

        if (normalizedQuestion.length >= 8 && item.normalizedText.includes(normalizedQuestion)) {
          score += 2;
        }

        const coverage = matchedTokens / Math.max(queryTokenSet.size, 1);

        return {
          entry: item.entry,
          score,
          coverage,
        };
      })
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score);

    const topK = options.topK ?? 3;
    return matches.slice(0, topK);
  }

  return { search };
}
