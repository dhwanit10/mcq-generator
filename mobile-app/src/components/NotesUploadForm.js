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
import { uploadStudyNotes } from '../services/mcqService';

/**
 * Notes Indexing Form
 * Uploads PDF study notes, extracts text, chunks, embeds, and persists to Qdrant.
 */
export default function NotesUploadForm() {
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('maths');
  const [topic, setTopic] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const picked = res.assets[0];
        setFile({
          uri: picked.uri,
          name: picked.name,
          mimeType: picked.mimeType || 'application/pdf',
          size: picked.size,
        });
        setResult(null);
        setErrorMessage(null);
      }
    } catch (err) {
      Alert.alert('File Picker', 'Failed to pick file: ' + err.message);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Alert.alert('Missing File', 'Please select a study notes PDF first.');
      return;
    }

    setIsUploading(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const data = await uploadStudyNotes({
        file,
        subject,
        topic,
        documentTitle,
      });
      setResult(data);
    } catch (err) {
      setErrorMessage(err.message || 'Indexing failed. Check connection.');
    } finally {
      setIsUploading(false);
    }
  };

  const subjects = [
    { key: 'maths', label: 'Maths' },
    { key: 'physics', label: 'Physics' },
    { key: 'chemistry', label: 'Chemistry' },
    { key: 'biology', label: 'Biology' },
  ];

  return (
    <View style={styles.card}>
      {/* Title */}
      <View style={styles.cardHeader}>
        <View style={styles.headerIconWrapper}>
          <Ionicons name="server-outline" size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.cardTitle}>Index Study Notes into Vector Store</Text>
          <Text style={styles.cardSubtitle}>
            Extract, chunk, embed, and persist to Qdrant
          </Text>
        </View>
      </View>

      {/* File Picker */}
      <View style={styles.fieldGroup}>
        <Text style={styles.inputLabel}>Study Material PDF</Text>
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
              {file ? file.name : 'Select PDF notes from device'}
            </Text>
            {file && (
              <Text style={styles.fileSizeText}>
                {(file.size / 1024).toFixed(1)} KB • Ready for indexing
              </Text>
            )}
          </View>
          {file && (
            <TouchableOpacity onPress={() => setFile(null)} style={styles.clearBtn}>
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Subject Chips */}
      <View style={styles.fieldGroup}>
        <Text style={styles.inputLabel}>Subject</Text>
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
      </View>

      {/* Topic Input */}
      <View style={styles.fieldGroup}>
        <Text style={styles.inputLabel}>Topic / Chapter Name</Text>
        <TextInput
          style={styles.textInput}
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g., Organic Reaction Mechanisms, Gravitation"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Document Title Input */}
      <View style={styles.fieldGroup}>
        <Text style={styles.inputLabel}>Document Title (Optional)</Text>
        <TextInput
          style={styles.textInput}
          value={documentTitle}
          onChangeText={setDocumentTitle}
          placeholder="e.g., NCERT Physics Chapter 8"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Error alert (using warm amber/burnished rust - strictly non-red) */}
      {errorMessage && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Success result card */}
      {result && (
        <View style={styles.successBox}>
          <View style={styles.successHeader}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.successTitle}>Indexing Succeeded!</Text>
          </View>
          <Text style={styles.successMessage}>
            {result.message || 'Notes successfully processed and indexed into Qdrant vector store.'}
          </Text>
          <View style={styles.statsRow}>
            {result.total_chunks != null && (
              <View style={styles.statPill}>
                <Text style={styles.statNumber}>{result.total_chunks}</Text>
                <Text style={styles.statLabel}>Chunks Created</Text>
              </View>
            )}
            {result.vectors_upserted != null && (
              <View style={styles.statPill}>
                <Text style={styles.statNumber}>{result.vectors_upserted}</Text>
                <Text style={styles.statLabel}>Vectors Stored</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Upload button */}
      <TouchableOpacity
        style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
        onPress={handleUpload}
        disabled={isUploading}
        activeOpacity={0.85}
      >
        {isUploading ? (
          <ActivityIndicator color={colors.textLight} size="small" />
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={18} color={colors.textLight} />
            <Text style={styles.uploadButtonText}>Extract & Index Notes</Text>
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
    gap: 10,
  },
  headerIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  fieldGroup: {
    marginBottom: 14,
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
    backgroundColor: colors.surfaceSecondary,
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
  clearBtn: {
    padding: 4,
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
  textInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.text,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '800',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBackground,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  successMessage: {
    fontSize: 12,
    color: colors.text,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
