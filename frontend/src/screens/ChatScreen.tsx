// src/screens/ChatScreen.tsx — Global lobby chat room
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '@hooks/useSocket';
import { useUserStore } from '@store/userStore';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { SOCKET_EMIT, SOCKET_ON } from '@/constants/socketEvents';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export const ChatScreen: React.FC = () => {
  const { socket, emit, connected } = useSocket();
  const user = useUserStore((s) => s.user);
  const loginGuest = useUserStore((s) => s.loginGuest);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const ensureGuest = useCallback(() => {
    if (!user) {
      loginGuest(`Guest${Date.now().toString(36).slice(-4).toUpperCase()}`);
    }
  }, [user, loginGuest]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-199), msg]);
    };
    socket.on(SOCKET_ON.LOBBY_MESSAGE, handler);
    return () => { socket.off(SOCKET_ON.LOBBY_MESSAGE, handler); };
  }, [socket]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !connected) return;
    ensureGuest();
    emit(SOCKET_EMIT.LOBBY_CHAT, { text });
    setInput('');
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMe = item.userId === user?.id;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.username[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!isMe && <Text style={styles.sender}>{item.username}</Text>}
          <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
          <Text style={[styles.time, isMe && styles.timeMe]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.statusBar}>
          <View style={[styles.dot, connected ? styles.dotOnline : styles.dotOffline]} />
          <Text style={styles.statusText}>
            {connected ? 'Global lobby — live' : 'Connecting…'}
          </Text>
        </View>

        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={56} color={COLORS.outlineVariant} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyBody}>Be the first to say hi in the global lobby!</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={connected ? 'Say something…' : 'Waiting for connection…'}
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            editable={connected}
            maxLength={256}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || !connected) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || !connected}
          >
            <Ionicons name="send" size={20} color={COLORS.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOnline: { backgroundColor: COLORS.timerGreen },
  dotOffline: { backgroundColor: COLORS.textMuted },
  statusText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  emptyBody: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: { padding: SPACING.md, gap: 8 },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  msgRowMe: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  bubble: {
    maxWidth: '72%',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  bubbleThem: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  sender: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  msgText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 20 },
  msgTextMe: { color: COLORS.onPrimary },
  time: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  timeMe: { color: 'rgba(255,255,255,0.6)' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
