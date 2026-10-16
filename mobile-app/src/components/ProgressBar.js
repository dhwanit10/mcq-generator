import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

/**
 * Generation Progress Indicator
 * Displays streaming status, elapsed timer, progress bar, and reset button.
 */
export default function ProgressBar({
  status,
  wsStatus,
  acceptedCount,
  totalRequested,
  elapsedSeconds,
  errorMessage,
  jobId,
  onReset,
}) {
  const percentage =
    totalRequested > 0
      ? Math.min(100, Math.round((acceptedCount / totalRequested) * 100))
      : 0;

  let statusText = 'Processing Batches';
  if (status === 'completed') {
    statusText = 'Generation Complete';
  } else if (status === 'partial') {
    statusText = 'Partial — Retry Budget Reached';
  } else if (status === 'error') {
    statusText = 'Generation Failed';
  } else if (wsStatus === 'retrieval_started') {
    statusText = 'Retrieving Evidence from Vector Store...';
  } else if (wsStatus === 'retrieval_completed') {
    statusText = 'Evidence Retrieved — Generating MCQs';
  } else if (acceptedCount > 0 && acceptedCount < totalRequested) {
    statusText = 'Streaming Valid Questions...';
  }

  const isCompleted = status === 'completed';
  const isError = status === 'error';
  const isRunning = status === 'processing' || status === 'started';

  return (
    <View style={styles.card}>
      {/* Top action row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={onReset}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={14} color={colors.textLight} />
          <Text style={styles.resetButtonText}>Configure New Job</Text>
        </TouchableOpacity>

        {/* Live indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {jobId && (
            <View style={styles.jobIdPill}>
              <Text style={styles.jobIdText}>#{jobId.slice(0, 8)}</Text>
            </View>
          )}
          {isRunning && (
            <View style={styles.liveIndicator}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>LIVE STREAM</Text>
            </View>
          )}
        </View>
      </View>

      {/* Status & Stats header */}
      <View style={styles.statusHeader}>
        <View style={styles.statusTitleRow}>
          {isRunning && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
          )}
          {isCompleted && (
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          )}
          {isError && (
            <Ionicons name="alert-circle" size={18} color={colors.error} style={{ marginRight: 6 }} />
          )}
          <Text style={styles.statusTitle}>{statusText}</Text>
        </View>

        <View style={styles.countersRow}>
          <View style={styles.elapsedBox}>
            <Ionicons name="time-outline" size={13} color={colors.accent} />
            <Text style={styles.elapsedText}>{elapsedSeconds}s</Text>
          </View>
          <Text style={styles.countText}>
            <Text style={styles.countHighlight}>{acceptedCount}</Text> / {totalRequested} MCQs
          </Text>
        </View>
      </View>

      {/* Progress Bar Track */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%` },
            isError && { backgroundColor: colors.error },
          ]}
        />
      </View>

      {/* Progress percentage label */}
      <View style={styles.percentRow}>
        <Text style={styles.percentText}>{percentage}% Completed</Text>
      </View>

      {/* Error message */}
      {errorMessage && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText}>Error: {errorMessage}</Text>
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceDark,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 6,
  },
  resetButtonText: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '700',
  },
  jobIdPill: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  jobIdText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    gap: 6,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  statusHeader: {
    marginBottom: 10,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  countersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  elapsedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  elapsedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentDark,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  countHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  percentRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  percentText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBackground,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
    flex: 1,
  },
});
