import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, type ChatMessage } from '../../../services/chatApi';
import { useChatSocket } from '../../../hooks/useChatSocket';
import { useAuthStore } from '../../../stores/authStore';

export default function ChatThreadScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingVisible, setTypingVisible] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const lastTypingSent = useRef(0);

  const chatSocket = useChatSocket();

  // Connect socket and join conversation
  useEffect(() => {
    chatSocket.connect();
    return () => { chatSocket.disconnect(); };
  }, []);

  useEffect(() => {
    if (chatSocket.isConnected && conversationId) {
      chatSocket.joinConversation(conversationId);
      chatSocket.markAsRead(conversationId);
    }
  }, [chatSocket.isConnected, conversationId]);

  // Load initial messages
  useEffect(() => {
    if (!conversationId) return;
    (async () => {
      try {
        const data = await chatApi.getMessages(conversationId);
        setMessages(data.messages);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId]);

  // Handle incoming messages
  useEffect(() => {
    const unsub = chatSocket.onMessage((msg: ChatMessage) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.senderId !== user?.id) {
          chatSocket.markAsRead(conversationId!);
        }
      }
    });
    return unsub;
  }, [chatSocket.onMessage, conversationId, user?.id]);

  // Handle typing indicator
  useEffect(() => {
    const unsub = chatSocket.onTyping((data) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingVisible(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingVisible(false), 3000);
      }
    });
    return unsub;
  }, [chatSocket.onTyping, conversationId, user?.id]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !conversationId || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    try {
      await chatApi.sendMessage(conversationId, content);
    } catch {
      setInput(content);
    } finally {
      setSending(false);
    }
  }, [input, conversationId, sending]);

  const handleTyping = useCallback(() => {
    if (!conversationId) return;
    const now = Date.now();
    if (now - lastTypingSent.current > 2000) {
      chatSocket.sendTyping(conversationId);
      lastTypingSent.current = now;
    }
  }, [conversationId, chatSocket.sendTyping]);

  const loadMore = useCallback(async () => {
    if (!cursor || !conversationId) return;
    try {
      const data = await chatApi.getMessages(conversationId, cursor);
      setMessages((prev) => [...data.messages, ...prev]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      console.error('Failed to load more messages:', err);
    }
  }, [cursor, conversationId]);

  const renderMessage = ({ item: msg }: { item: ChatMessage }) => {
    const isMe = msg.senderId === user?.id;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {!isMe && <Text style={styles.senderName}>{msg.senderName}</Text>}
          <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{msg.content}</Text>
          <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#009DE0" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Support</Text>
          {chatSocket.isConnected && (
            <Text style={styles.onlineText}>Online</Text>
          )}
        </View>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            hasMore ? (
              <TouchableOpacity style={styles.loadMore} onPress={loadMore}>
                <Text style={styles.loadMoreText}>Load older messages</Text>
              </TouchableOpacity>
            ) : null
          }
          ListFooterComponent={
            typingVisible ? (
              <View style={styles.typingRow}>
                <Text style={styles.typingText}>typing...</Text>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={(text) => { setInput(text); handleTyping(); }}
            placeholder="Type a message..."
            maxLength={2000}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flex1: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  onlineText: { fontSize: 12, color: '#22c55e', marginTop: 1 },
  messagesList: { padding: 16, paddingBottom: 8 },
  loadMore: { alignItems: 'center', paddingVertical: 12 },
  loadMoreText: { color: '#009DE0', fontSize: 14, fontWeight: '500' },
  msgRow: { marginBottom: 8 },
  msgRowRight: { alignItems: 'flex-end' },
  msgRowLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: { backgroundColor: '#009DE0', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#f0f0f0', borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, color: '#888', marginBottom: 2 },
  msgText: { fontSize: 15, color: '#1a1a1a', lineHeight: 20 },
  msgTextMe: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#999', marginTop: 4, alignSelf: 'flex-end' },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
  typingRow: { paddingLeft: 16, paddingVertical: 4 },
  typingText: { fontSize: 13, color: '#22c55e', fontStyle: 'italic' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#009DE0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
