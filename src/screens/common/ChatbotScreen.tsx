import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatbot } from '@hooks/useChatbot';
import { Button } from '@components/common/Button';
import { EmptyState } from '@components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/theme';
import type { ChatMessage } from 'src/@types/chatbot.types';

interface ChatbotScreenProps {
  title: string;
}

function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const MessageBubble: React.FC<{ item: ChatMessage }> = ({ item }) => {
  const isUser = item.sender === 'user';

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {item.text}
        </Text>
        <Text style={[styles.bubbleTime, isUser ? styles.bubbleTimeUser : styles.bubbleTimeAssistant]}>
          {formatClock(item.createdAt)}
        </Text>
      </View>
    </View>
  );
};

export const ChatbotScreen: React.FC<ChatbotScreenProps> = ({ title }) => {
  const { messages, isSending, error, lastFallback, hasSupportCta, submitMessage, clearConversation, openSupport } =
    useChatbot();

  const [input, setInput] = useState('');

  const listData = useMemo(() => [...messages].reverse(), [messages]);

  const handleSend = async () => {
    const payload = input;
    if (!payload.trim()) return;
    setInput('');
    await submitMessage(payload);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={clearConversation} activeOpacity={0.7}>
            <Text style={styles.clearAction}>Limpar</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {messages.length === 0 ? (
          <EmptyState
            icon="🤖"
            title="Chat IA"
            description="Envie uma pergunta sobre o aplicativo para receber ajuda rápida."
          />
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble item={item} />}
            contentContainerStyle={styles.listContent}
            inverted
            keyboardShouldPersistTaps="handled"
          />
        )}

        {lastFallback && hasSupportCta ? (
          <View style={styles.fallbackCard}>
            <Text style={styles.fallbackTitle}>{lastFallback.title}</Text>
            <Text style={styles.fallbackDescription}>{lastFallback.description}</Text>
            <Button
              label={lastFallback.ctaLabel}
              size="sm"
              variant="outline"
              onPress={openSupport}
              style={styles.fallbackButton}
            />
          </View>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Pergunte sobre pagamentos, conta ou uso do app"
            placeholderTextColor={Colors.textDisabled}
            style={styles.input}
            multiline
            maxLength={600}
            editable={!isSending}
            onSubmitEditing={handleSend}
          />
          <Button
            label={isSending ? 'Enviando...' : 'Enviar'}
            onPress={handleSend}
            loading={isSending}
            disabled={!input.trim() || isSending}
            size="sm"
            style={styles.sendButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
  },
  clearAction: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  messageRow: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  messageRowAssistant: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: BorderRadius.sm,
  },
  bubbleAssistant: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  bubbleText: {
    fontSize: Typography.fontSize.md,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: Colors.textInverse,
  },
  bubbleTextAssistant: {
    color: Colors.textPrimary,
  },
  bubbleTime: {
    marginTop: 6,
    fontSize: Typography.fontSize.xs,
  },
  bubbleTimeUser: {
    color: '#DCE6FF',
    alignSelf: 'flex-end',
  },
  bubbleTimeAssistant: {
    color: Colors.textDisabled,
    alignSelf: 'flex-end',
  },
  fallbackCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  fallbackTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  fallbackDescription: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  fallbackButton: {
    alignSelf: 'flex-start',
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    minHeight: 46,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.md,
    textAlignVertical: 'top',
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
});
