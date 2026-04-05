import { useCallback, useEffect, useMemo } from 'react';
import * as Linking from 'expo-linking';
import { chatbotService } from '@services/chatbot.service';
import { useChatbotStore } from '@store/chatbot.store';
import { useAuthStore } from '@store/auth.store';
import type { ChatSessionContext } from 'src/@types/chatbot.types';

export const useChatbot = () => {
  const user = useAuthStore((s) => s.user);

  const {
    messages,
    isSending,
    error,
    lastFallback,
    setSending,
    setError,
    appendMessage,
    setMessages,
    setFallback,
    reset,
  } = useChatbotStore();

  const context = useMemo<ChatSessionContext | null>(() => {
    if (!user) return null;
    return {
      userId: user.id,
      userRole: user.role,
      userName: user.name,
    };
  }, [user?.id, user?.role, user?.name]);

  useEffect(() => {
    if (!context) {
      reset();
      return;
    }

    if (messages.length === 0) {
      setMessages([chatbotService.createWelcomeMessage(context.userRole)]);
    }
  }, [context?.userId]);

  const submitMessage = useCallback(
    async (input: string) => {
      if (!context || isSending) return;

      const validationError = chatbotService.validateInput(input);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      const userMessage = chatbotService.createUserMessage(input);
      appendMessage(userMessage);
      setSending(true);

      try {
        const result = await chatbotService.sendMessage(context, input);
        appendMessage(result.message);
        setFallback(result.fallback ?? null);
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao conversar com a IA.');
      } finally {
        setSending(false);
      }
    },
    [context, isSending],
  );

  const clearConversation = useCallback(() => {
    if (!context) {
      reset();
      return;
    }

    setMessages([chatbotService.createWelcomeMessage(context.userRole)]);
    setError(null);
    setFallback(null);
  }, [context?.userId]);

  const openSupport = useCallback(async () => {
    if (!lastFallback?.ctaUrl) return;
    const canOpen = await Linking.canOpenURL(lastFallback.ctaUrl);
    if (canOpen) {
      await Linking.openURL(lastFallback.ctaUrl);
    }
  }, [lastFallback?.ctaUrl]);

  return {
    messages,
    isSending,
    error,
    lastFallback,
    hasSupportCta: !!lastFallback?.ctaUrl,
    submitMessage,
    clearConversation,
    openSupport,
  };
};
