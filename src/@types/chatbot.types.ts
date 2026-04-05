import type { UserRole } from 'src/@types/user.types';

export type ChatMessageSender = 'user' | 'assistant' | 'system';

export type ChatFallbackReason =
  | 'out_of_scope'
  | 'low_confidence'
  | 'configuration_error'
  | 'network_error'
  | 'provider_error';

export interface ChatbotFallback {
  reason: ChatFallbackReason;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface ChatMessage {
  id: string;
  sender: ChatMessageSender;
  text: string;
  createdAt: Date;
  fallback?: ChatbotFallback;
}

export interface ChatSessionContext {
  userId: string;
  userRole: UserRole;
  userName?: string;
}

export interface ChatbotResult {
  message: ChatMessage;
  fallback?: ChatbotFallback;
}

export interface ChatbotConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  supportLabel: string;
  supportUrl: string;
  timeoutMs: number;
}
