import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

/**
 * Tab Navigation Bar
 * Switches between 'generate' and 'index' modes.
 */
export default function TabBar({ activeTab, onSelectTab }) {
  const tabs = [
    { key: 'generate', label: 'Generate MCQs', icon: 'flash' },
    { key: 'index', label: 'Index Study Notes', icon: 'server-outline' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={isActive ? colors.textLight : colors.textSecondary}
            />
            <Text
              style={[styles.tabLabel, isActive && styles.tabLabelActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.surfaceDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.textLight,
    fontWeight: '700',
  },
});
