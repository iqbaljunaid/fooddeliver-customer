import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { chatApi, type Conversation } from '../../services/chatApi';

export default function ChatListScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleNewChat = async () => {
    setCreating(true);
    try {
      const data = await chatApi.createConversation();
      router.push(`/(main)/chat/${data.conversation.id}`);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    } finally {
      setCreating(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return d.toLocaleDateString();
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
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Support</Text>
        <TouchableOpacity onPress={handleNewChat} disabled={creating} style={styles.newBtn}>
          {creating ? (
            <ActivityIndicator size="small" color="#009DE0" />
          ) : (
            <Ionicons name="create-outline" size={24} color="#009DE0" />
          )}
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No conversations</Text>
          <Text style={styles.emptySubtitle}>Start a new chat with our support team</Text>
          <TouchableOpacity style={styles.startBtn} onPress={handleNewChat} disabled={creating}>
            <Text style={styles.startBtnText}>Start Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convItem}
              onPress={() => router.push(`/(main)/chat/${item.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.admin_name || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.convContent}>
                <View style={styles.convTop}>
                  <Text style={styles.convName} numberOfLines={1}>
                    {item.admin_name || 'Support'}
                  </Text>
                  <Text style={styles.convTime}>
                    {item.last_message_at ? formatTime(item.last_message_at) : ''}
                  </Text>
                </View>
                <View style={styles.convBottom}>
                  <Text style={styles.convPreview} numberOfLines={1}>
                    {item.last_message || 'No messages yet'}
                  </Text>
                  {item.unread_count > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.unread_count > 9 ? '9+' : item.unread_count}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { padding: 4 },
  header: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  newBtn: { padding: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#999', marginTop: 4, textAlign: 'center' },
  startBtn: {
    marginTop: 24,
    backgroundColor: '#009DE0',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  convItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#009DE0' },
  convContent: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  convTime: { fontSize: 12, color: '#999', marginLeft: 8 },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convPreview: { fontSize: 14, color: '#666', flex: 1 },
  badge: {
    backgroundColor: '#009DE0',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
