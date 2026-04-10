import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { getApiUrl, getSocketUrl, setServerUrls } from '../../services/serverConfig';

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [socketUrl, setSocketUrlState] = useState('');

  useEffect(() => {
    setServerUrl(getApiUrl().replace(/\/api$/, ''));
    setSocketUrlState(getSocketUrl());
  }, []);

  const handleSaveServer = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Error', 'Please enter a server URL');
      return;
    }
    const trimmedApi = serverUrl.trim().replace(/\/+$/, '');
    const trimmedSocket = socketUrl.trim().replace(/\/+$/, '') || trimmedApi;
    await setServerUrls(trimmedApi, trimmedSocket);
    setShowServerConfig(false);
    Alert.alert('Saved', `Server: ${trimmedApi}`);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    try {
      await login(email.trim(), password);
      router.replace('/(main)');
    } catch {
      // Error is set in store
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🍔</Text>
          <Text style={styles.title}>Food Rush</Text>
          <Text style={styles.subtitle}>Sign in to order delicious food</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) clearError();
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) clearError();
              }}
              secureTextEntry={!showPassword}
              textContentType="password"
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, (!email.trim() || !password.trim()) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading || !email.trim() || !password.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serverConfigButton}
          onPress={() => setShowServerConfig(true)}
        >
          <Text style={styles.serverConfigText}>⚙ Server Settings</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showServerConfig}
        animationType="slide"
        transparent
        onRequestClose={() => setShowServerConfig(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Server Configuration</Text>

            <Text style={styles.modalLabel}>API Server URL</Text>
            <TextInput
              style={styles.modalInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://138.2.177.115"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={styles.modalLabel}>WebSocket URL</Text>
            <TextInput
              style={styles.modalInput}
              value={socketUrl}
              onChangeText={setSocketUrlState}
              placeholder="http://138.2.177.115"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowServerConfig(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveServer}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eyeIcon: {
    fontSize: 18,
  },
  button: {
    backgroundColor: '#009DE0',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#B0D9EF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    marginBottom: 32,
  },
  registerText: {
    fontSize: 15,
    color: '#666',
  },
  registerBold: {
    fontWeight: '600',
    color: '#009DE0',
  },
  serverConfigButton: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  serverConfigText: {
    fontSize: 13,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  modalSaveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#009DE0',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});
