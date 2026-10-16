import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

/**
 * Generation Configuration Form
 * Configures either direct PDF generation or RAG Notes generation.
 */
export default function GenerationForm({ onSubmit, isSubmitting }) {
  // Source mode: 'pdf' | 'notes'
  const [sourceMode, setSourceMode] = useState('pdf');

  // PDF mode state
  const [file, setFile] = useState(null);

  // Notes mode state
  const [subject, setSubject] = useState('maths');
  const [topic, setTopic] = useState('');

  // Common parameters
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [bloomLevel, setBloomLevel] = useState('apply');
  const [generationMode, setGenerationMode] = useState('parallel');
  const [questionsPerBatch, setQuestionsPerBatch] = useState(10);
  const [maxConcurrentRequests, setMaxConcurrentRequests] = useState(5);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Pick PDF file from device
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked = result.assets[0];
        setFile({
          uri: picked.uri,
          name: picked.name,
          mimeType: picked.mimeType || 'application/pdf',
          size: picked.size,
        });
      }
    } catch (err) {
      Alert.alert('File Picker', 'Could not open file picker: ' + err.message);
    }
  };

  const handleFormSubmit = () => {
    if (sourceMode === 'pdf' && !file) {
      Alert.alert('Missing PDF', 'Please select a PDF document first.');
      return;
    }

    const common = {
      numberOfQuestions: Number(numberOfQuestions) || 10,
      difficulty,
      bloomLevel,
      generationMode,
      questionsPerBatch: Number(questionsPerBatch) || 10,
      maxConcurrentRequests: Number(maxConcurrentRequests) || 5,
    };

    if (sourceMode === 'pdf') {
      onSubmit({ mode: 'pdf', file, ...common });
    } else {
      onSubmit({
        mode: 'notes',
        subject,
        topic: topic.trim() || null,
        ...common,
      });
    }
  };

  const subjects = [
    { key: 'maths', label: 'Maths' },
    { key: 'physics', label: 'Physics' },
    { key: 'chemistry', label: 'Chemistry' },
    { key: 'biology', label: 'Biology' },
  ];

  const difficulties = [
    { key: 'easy', label: 'Easy' },
    { key: 'medium', label: 'Medium' },
    { key: 'hard', label: 'Hard' },
  ];

  const bloomLevels = [
    { key: 'remember', label: 'Remember' },
    { key: 'understand', label: 'Understand' },
    { key: 'apply', label: 'Apply' },
    { key: 'analyze', label: 'Analyze' },
  ];

  const quickCounts = [5, 10, 20, 50];

  return (
    <View style={styles.card}>
      {/* Title */}
      <View style={styles.cardHeader}>
        <View style={styles.headerIconWrapper}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
        </View>
        <Text style={styles.cardTitle}>Configure MCQ Generation</Text>
      </View>

      {/* ── Source Mode Toggle ── */}
      <Text style={styles.sectionLabel}>Generation Source</Text>
      <View style={styles.sourceToggleRow}>
        <TouchableOpacity
          style={[
            styles.sourceOption,
            sourceMode === 'pdf' && styles.sourceOptionActive,
          ]}
          onPress={() => setSourceMode('pdf')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={16}
            color={sourceMode === 'pdf' ? colors.textLight : colors.text}
          />
          <Text
            style={[
              styles.sourceOptionText,
              sourceMode === 'pdf' && styles.sourceOptionTextActive,
            ]}
          >
            Upload PDF
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sourceOption,
            sourceMode === 'notes' && styles.sourceOptionActive,
          ]}
          onPress={() => setSourceMode('notes')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="book-outline"
            size={16}
            color={sourceMode === 'notes' ? colors.textLight : colors.text}
          />
          <Text
            style={[
              styles.sourceOptionText,
              sourceMode === 'notes' && styles.sourceOptionTextActive,
            ]}
          >
            From Notes (RAG)
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Mode 1: PDF Upload ── */}
      {sourceMode === 'pdf' ? (
        <View style={styles.modeSection}>
          <Text style={styles.inputLabel}>PDF Document</Text>
          <TouchableOpacity
            style={[
              styles.filePickerButton,
              file && styles.filePickerButtonSelected,
            ]}
            onPress={pickDocument}
            activeOpacity={0.7}
          >
            <Ionicons
              name={file ? 'checkmark-circle' : 'document-attach-outline'}
              size={22}
              color={file ? colors.primary : colors.textSecondary}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.filePickerText,
                  file && styles.filePickerTextSelected,
                ]}
                numberOfLines={1}
              >
                {file ? file.name : 'Tap to select PDF from device'}
              </Text>
              {file && (
                <Text style={styles.fileSizeText}>
                  {(file.size / 1024).toFixed(1)} KB • Ready for generation
                </Text>
              )}
            </View>
            {file && (
              <TouchableOpacity
                onPress={() => setFile(null)}
                style={styles.clearFileBtn}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Mode 2: RAG Notes ── */
        <View style={styles.modeSection}>
          <Text style={styles.inputLabel}>Subject Area</Text>
          <View style={styles.chipRow}>
            {subjects.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.chip,
                  subject === item.key && styles.chipActive,
                ]}
                onPress={() => setSubject(item.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    subject === item.key && styles.chipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Specific Topic (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g., Photosynthesis, Newton Laws, Calculus"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      )}

      {/* ── Number of Questions ── */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelWithBadge}>
          <Text style={styles.inputLabel}>Number of Questions</Text>
          <Text style={styles.valueBadge}>{numberOfQuestions}</Text>
        </View>
        <View style={styles.chipRow}>
          {quickCounts.map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.chip,
                numberOfQuestions === count && styles.chipActive,
              ]}
              onPress={() => setNumberOfQuestions(count)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  numberOfQuestions === count && styles.chipTextActive,
                ]}
              >
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Difficulty ── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.inputLabel}>Difficulty</Text>
        <View style={styles.chipRow}>
          {difficulties.map((d) => (
            <TouchableOpacity
              key={d.key}
              style={[
                styles.chip,
                difficulty === d.key && styles.chipActive,
              ]}
              onPress={() => setDifficulty(d.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  difficulty === d.key && styles.chipTextActive,
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Bloom's Taxonomy Level ── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.inputLabel}>Bloom's Taxonomy Level</Text>
        <View style={styles.chipRow}>
          {bloomLevels.map((b) => (
            <TouchableOpacity
              key={b.key}
              style={[
                styles.chip,
                bloomLevel === b.key && styles.chipActive,
              ]}
              onPress={() => setBloomLevel(b.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  bloomLevel === b.key && styles.chipTextActive,
                ]}
              >
                {b.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Advanced Settings Collapsible ── */}
      <TouchableOpacity
        style={styles.advancedToggle}
        onPress={() => setIsAdvancedOpen(!isAdvancedOpen)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isAdvancedOpen ? 'chevron-down' : 'chevron-forward'}
          size={16}
          color={colors.primary}
        />
        <Text style={styles.advancedToggleText}>
          {isAdvancedOpen ? 'Hide Advanced Settings' : 'Show Advanced Pipeline Settings'}
        </Text>
      </TouchableOpacity>

      {isAdvancedOpen && (
        <View style={styles.advancedBox}>
          <Text style={styles.inputLabel}>Generation Mode</Text>
          <View style={styles.chipRow}>
            {['parallel', 'sequential'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.chip,
                  generationMode === m && styles.chipActive,
                ]}
                onPress={() => setGenerationMode(m)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    generationMode === m && styles.chipTextActive,
                  ]}
                >
                  {m.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { marginTop: 10 }]}>Questions per Batch</Text>
          <View style={styles.chipRow}>
            {[5, 10, 20].map((b) => (
              <TouchableOpacity
                key={b}
                style={[
                  styles.chip,
                  questionsPerBatch === b && styles.chipActive,
                ]}
                onPress={() => setQuestionsPerBatch(b)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    questionsPerBatch === b && styles.chipTextActive,
                  ]}
                >
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { marginTop: 10 }]}>Max Concurrent Requests</Text>
          <View style={styles.chipRow}>
            {[2, 5, 8].map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.chip,
                  maxConcurrentRequests === c && styles.chipActive,
                ]}
                onPress={() => setMaxConcurrentRequests(c)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    maxConcurrentRequests === c && styles.chipTextActive,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Submit Button ── */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={handleFormSubmit}
        disabled={isSubmitting}
        activeOpacity={0.85}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.textLight} size="small" />
        ) : (
          <>
            <Ionicons name="flash" size={18} color={colors.textLight} />
            <Text style={styles.submitButtonText}>Generate Questions</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  headerIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sourceOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  sourceOptionActive: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.surfaceDark,
  },
  sourceOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sourceOptionTextActive: {
    color: colors.textLight,
  },
  modeSection: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: 10,
  },
  filePickerButtonSelected: {
    borderColor: colors.primary,
    borderStyle: 'solid',
    backgroundColor: colors.primaryMuted,
  },
  filePickerText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filePickerTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  fileSizeText: {
    fontSize: 11,
    color: colors.primaryDark,
    marginTop: 2,
  },
  clearFileBtn: {
    padding: 4,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.text,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  labelWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  valueBadge: {
    backgroundColor: colors.primaryMuted,
    color: colors.primaryDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryDeep,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primaryMuted,
    fontWeight: '700',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
    marginBottom: 10,
  },
  advancedToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  advancedBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
