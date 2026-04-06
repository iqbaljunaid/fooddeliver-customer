import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { profileApi } from '../../services/api';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const hasChanges = name !== (user?.name || '') || phone !== (user?.phone || '');

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const updated = await profileApi.update({ name: name.trim(), phone: phone.trim() });
      updateUser(updated);
      Alert.alert('Profile Updated', 'Your changes have been saved.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [name, phone, hasChanges, updateUser]);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  }, [logout]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Profile</Text>
      <ScrollView style={styles.scroll}>
        {/* Email (read-only) */}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.readOnly}>
            <Text style={styles.readOnlyText}>{user?.email || '-'}</Text>
          </View>
        </View>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
          />
        </View>

        {/* Phone */}
        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />
        </View>

        {/* Save Button */}
        {hasChanges && (
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Account Section */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{user?.role || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member since</Text>
            <Text style={styles.infoValue}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : '-'}
            </Text>
          </View>
        </View>

        {/* Support Chat */}
        <TouchableOpacity style={styles.supportBtn} onPress={() => router.push('/(main)/chat')}>
          <Ionicons name="chatbubbles-outline" size={20} color="#009DE0" />
          <Text style={styles.supportBtnText}>Support Chat</Text>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    padding: 16,
    backgroundColor: '#fff',
  },
  scroll: { flex: 1 },
  field: { backgroundColor: '#fff', padding: 16, marginTop: 8 },
  label: { fontSize: 13, color: '#888', marginBottom: 4, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  readOnly: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  readOnlyText: { fontSize: 16, color: '#666' },
  saveBtn: {
    backgroundColor: '#009DE0',
    margin: 16,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  accountSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  logoutBtn: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E74C3C',
    alignItems: 'center',
  },
  logoutBtnText: { color: '#E74C3C', fontSize: 16, fontWeight: '600' },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
    gap: 12,
  },
  supportBtnText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1A1A1A' },
});
