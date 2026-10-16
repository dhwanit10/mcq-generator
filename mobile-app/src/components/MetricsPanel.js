import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

/**
 * Generation Metrics Panel
 * Displays throughput, latencies, candidates generated vs accepted, and retry KPIs.
 */
export default function MetricsPanel({ metrics }) {
  if (!metrics) return null;

  const {
    generated_candidates = 0,
    accepted_questions = 0,
    rejected_questions = 0,
    retries = 0,
    concurrency,
    generation_mode,
    total_time_ms = 0,
    time_to_first_question_ms,
    batch_latencies_ms = [],
  } = metrics;

  const formatMs = (ms) => (ms != null ? `${(ms / 1000).toFixed(2)}s` : 'N/A');

  return (
    <View style={styles.card}>
      {/* Title */}
      <View style={styles.header}>
        <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
        <Text style={styles.title}>
          Throughput & Timing Metrics ({generation_mode ? generation_mode.toUpperCase() : 'PARALLEL'} • {concurrency || 5}x)
        </Text>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        {/* Total Time */}
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Time</Text>
          <Text style={[styles.kpiValue, { color: colors.primary }]}>
            {formatMs(total_time_ms)}
          </Text>
        </View>

        {/* Time to 1st Question */}
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Time to 1st MCQ</Text>
          <Text style={[styles.kpiValue, { color: colors.text }]}>
            {formatMs(time_to_first_question_ms)}
          </Text>
        </View>

        {/* Candidates vs Accepted */}
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Candidates / Accepted</Text>
          <Text style={[styles.kpiValue, { color: colors.text }]}>
            {generated_candidates} / {accepted_questions}
          </Text>
        </View>

        {/* Rejections & Retries */}
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Rejections / Retries</Text>
          <Text style={[styles.kpiValue, { color: colors.accentDark }]}>
            {rejected_questions} / {retries}
          </Text>
        </View>
      </View>

      {/* Batch Latencies breakdown */}
      {batch_latencies_ms && batch_latencies_ms.length > 0 && (
        <View style={styles.latencySection}>
          <Text style={styles.latencyTitle}>Batch Latencies (seconds)</Text>
          <View style={styles.batchRow}>
            {batch_latencies_ms.map((ms, idx) => (
              <View key={idx} style={styles.batchPill}>
                <Text style={styles.batchLabel}>B{idx + 1}</Text>
                <Text style={styles.batchValue}>{(ms / 1000).toFixed(2)}s</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceSecondary,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  latencySection: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  latencyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  batchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  batchPill: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  batchLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  batchValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
