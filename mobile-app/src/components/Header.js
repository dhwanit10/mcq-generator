import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

/**
 * Mobile App Header
 * Displays branding, backend health status, generation mode, and settings button.
 * Uses strict Emerald & Obsidian color scheme (NO blue, purple, pink, red).
 */
export default function Header({ isHealthy, onCheckHealth, activeMode, onOpenSettings }) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Ionicons name="sparkles" size={18} color={colors.textLight} />
          </View>
          <View>
            <Text style={styles.appTitle}>MCQ Generator</Text>
            <Text style={styles.appSubtitle}>Parallel AI Engine • Mobile</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {/* Health status badge */}
          <TouchableOpacity
            style={[
              styles.healthBadge,
              isHealthy ? styles.healthBadgeOk : styles.healthBadgeOffline,
            ]}
            onPress={onCheckHealth}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.healthDot,
                { backgroundColor: isHealthy ? colors.primaryLight : colors.accentLight },
              ]}
            />
            <Text
              style={[
                styles.healthText,
                { color: isHealthy ? colors.primaryMuted : colors.accentMuted },
              ]}
            >
              {isHealthy ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>

          {/* Settings button */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={onOpenSettings}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={18} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode pill */}
      <View style={styles.modeContainer}>
        <View style={styles.modePill}>
          <Ionicons
            name={activeMode === 'parallel' ? 'flash' : 'layers-outline'}
            size={12}
            color={colors.primaryLight}
          />
          <Text style={styles.modeText}>
            Mode: {activeMode ? activeMode.toUpperCase() : 'PARALLEL'}
          </Text>
        </View>
        <Text style={styles.hintText}>
          Real-time WebSocket Streaming
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceDark,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    color: colors.textLight,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  appSubtitle: {
    color: colors.textLightMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  healthBadgeOk: {
    backgroundColor: colors.primaryDeep,
    borderColor: colors.primary,
  },
  healthBadgeOffline: {
    backgroundColor: colors.surfaceDarkAccent,
    borderColor: colors.accentDark,
  },
  healthDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  healthText: {
    fontSize: 11,
    fontWeight: '700',
  },
  settingsButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.surfaceDarkAccent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDarkAccent,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 5,
  },
  modeText: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hintText: {
    color: colors.textLightMuted,
    fontSize: 11,
  },
});
