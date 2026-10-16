import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { getApiBaseUrl, setRuntimeApiBaseUrl, checkHealth } from '../config/api';

/**
 * Settings Modal
 * Allows viewing the current API URL routed from .env,
 * changing it dynamically, and testing connectivity.
 */
export default function SettingsModal({ visible, onClose, onHealthChange }) {
  const [url, setUrl] = useState(getApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const res = await checkHealth(url.trim());
    setIsTesting(false);
    setTestResult(res);
    if (onHealthChange) {
      onHealthChange(res.ok);
    }
  };

  const handleSave = () => {
    setRuntimeApiBaseUrl(url.trim());
    if (onClose) onClose();
  };

  const setPreset = (presetUrl) => {
    setUrl(presetUrl);
    setTestResult(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="settings-outline" size={20} color={colors.primary} />
              <Text style={styles.title}>API & Network Settings</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Explanation */}
          <Text style={styles.description}>
            The default API Base URL is loaded from{' '}
            <Text style={styles.boldText}>.env</Text> via{' '}
            <Text style={styles.codeText}>EXPO_PUBLIC_API_BASE_URL</Text>.
            You can change or override it here for testing.
          </Text>

          {/* Quick Presets */}
          <Text style={styles.sectionLabel}>Quick Presets:</Text>
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => setPreset('http://localhost:8000')}
            >
              <Text style={styles.presetText}>Localhost:8000</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => setPreset('http://10.0.2.2:8000')}
            >
              <Text style={styles.presetText}>Android (10.0.2.2)</Text>
            </TouchableOpacity>
          </View>

          {/* Input field */}
          <Text style={styles.inputLabel}>Backend Base URL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.1.15:8000"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Test Status feedback */}
          {testResult && (
            <View
              style={[
                styles.feedbackBox,
                testResult.ok ? styles.feedbackBoxOk : styles.feedbackBoxErr,
              ]}
            >
              <Ionicons
                name={testResult.ok ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={testResult.ok ? colors.primaryDark : colors.error}
              />
              <Text
                style={[
                  styles.feedbackText,
                  { color: testResult.ok ? colors.primaryDark : colors.error },
                ]}
              >
                {testResult.ok
                  ? 'Server reachable! Status: OK'
                  : `Connection failed: ${testResult.error}`}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="pulse" size={15} color={colors.primary} />
                  <Text style={styles.testBtnText}>Test Ping</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark" size={16} color={colors.textLight} />
              <Text style={styles.saveBtnText}>Apply URL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text,
  },
  codeText: {
    fontFamily: 'monospace',
    color: colors.primaryDark,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  presetText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
  },
  feedbackBoxOk: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primaryBorder,
  },
  feedbackBoxErr: {
    backgroundColor: colors.errorBackground,
    borderColor: colors.errorBorder,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    gap: 6,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: colors.primary,
    gap: 6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
});
