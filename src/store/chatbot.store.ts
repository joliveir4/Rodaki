import { create } from 'zustand';
import type { ChatMessage, ChatbotFallback } from 'src/@types/chatbot.types';

interface ChatbotState {
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  lastFallback: ChatbotFallback | null;

  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  appendMessage: (message: ChatMessage) => void;
  setFallback: (fallback: ChatbotFallback | null) => void;
  reset: () => void;
}

const initialState = {
  messages: [] as ChatMessage[],
  isLoading: false,
  isSending: false,
  error: null,
  lastFallback: null,
};

export const useChatbotStore = create<ChatbotState>((set) => ({
  ...initialState,

  setLoading: (isLoading) => set({ isLoading }),

  setSending: (isSending) => set({ isSending }),

  setError: (error) => set({ error }),

  setMessages: (messages) => set({ messages }),

  appendMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setFallback: (lastFallback) => set({ lastFallback }),

  reset: () => set(initialState),
}));
