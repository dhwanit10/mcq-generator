import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import VisualPreview from './VisualPreview';

/**
 * 1-Per-Screen MCQ Question Card with Pagination & Previous / Next Navigation
 */
export default function QuestionCard({
  question,
  currentIndex,
  totalQuestions,
  onNext,
  onPrevious,
  onSelectIndex,
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  if (!question) return null;

  const {
    question: qText,
    options = [],
    correct_option,
    explanation,
    difficulty,
    bloom_level,
    source_reference,
    has_visual,
    visual_type,
    visual_data,
  } = question;

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalQuestions - 1;

  return (
    <View style={styles.outerContainer}>
      {/* ── Top Progress & Counter Bar ── */}
      <View style={styles.paginationBar}>
        <View style={styles.counterRow}>
          <Text style={styles.counterText}>
            Question <Text style={styles.counterHighlight}>{currentIndex + 1}</Text> of {totalQuestions}
          </Text>
          <Text style={styles.progressPercentText}>
            {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
          </Text>
        </View>

        {/* Mini progress track */}
        <View style={styles.miniTrack}>
          <View
            style={[
              styles.miniFill,
              { width: `${((currentIndex + 1) / totalQuestions) * 100}%` },
            ]}
          />
        </View>

        {/* Quick jump pills (scrollable if many) */}
        {totalQuestions > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.jumpRow}
          >
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.jumpPill,
                    isCurrent && styles.jumpPillCurrent,
                  ]}
                  onPress={() => onSelectIndex(idx)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.jumpPillText,
                      isCurrent && styles.jumpPillTextCurrent,
                    ]}
                  >
                    {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ── Main Question Card ── */}
      <View style={styles.card}>
        {/* Badges Bar */}
        <View style={styles.badgeBar}>
          <View style={styles.badgeGroup}>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyBadgeText}>{difficulty || 'medium'}</Text>
            </View>

            <View style={styles.bloomBadge}>
              <Ionicons name="ribbon-outline" size={11} color={colors.accentDark} />
              <Text style={styles.bloomBadgeText}>
                {bloom_level ? bloom_level.toUpperCase() : 'APPLY'}
              </Text>
            </View>

            {(has_visual || visual_type) && (
              <View style={styles.visualBadge}>
                <Ionicons name="eye-outline" size={11} color={colors.primaryDark} />
                <Text style={styles.visualBadgeText}>
                  {visual_type || 'Visual'}
                </Text>
              </View>
            )}
          </View>

          {source_reference && (
            <View style={styles.refBadge}>
              <Ionicons name="bookmark-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.refText}>{source_reference}</Text>
            </View>
          )}
        </View>

        {/* Question Prompt */}
        <Text style={styles.questionText}>{qText}</Text>

        {/* Visual Component (2D SMILES molecule image, graph, diagram) */}
        <VisualPreview
          hasVisual={has_visual}
          visualType={visual_type}
          visualData={visual_data}
          qText={qText}
        />

        {/* Options List */}
        <View style={styles.optionsContainer}>
          {options.map((opt, i) => {
            const isCorrect = i === correct_option;
            const isSelected = selectedOption === i;

            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.optionRow,
                  isSelected && !isCorrect && styles.optionRowSelected,
                  isCorrect && styles.optionRowCorrect,
                ]}
                onPress={() => setSelectedOption(i)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.optionLetterBox,
                    isSelected && !isCorrect && styles.optionLetterBoxSelected,
                    isCorrect && styles.optionLetterBoxCorrect,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLetterText,
                      isCorrect && styles.optionLetterTextCorrect,
                    ]}
                  >
                    {optionLetters[i] || i + 1}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.optionText,
                    isCorrect && styles.optionTextCorrect,
                  ]}
                >
                  {opt}
                </Text>

                {isCorrect && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                    style={styles.correctIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation & Reasoning Accordion */}
        {explanation && (
          <View style={styles.explanationSection}>
            <TouchableOpacity
              style={styles.explanationHeader}
              onPress={() => setShowExplanation(!showExplanation)}
              activeOpacity={0.7}
            >
              <View style={styles.explanationHeaderLeft}>
                <Ionicons
                  name={showExplanation ? 'bulb' : 'bulb-outline'}
                  size={16}
                  color={colors.accentDark}
                />
                <Text style={styles.explanationHeaderText}>
                  {showExplanation ? 'Hide Explanation' : 'View Solution & Explanation'}
                </Text>
              </View>
              <Ionicons
                name={showExplanation ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.accentDark}
              />
            </TouchableOpacity>

            {showExplanation && (
              <View style={styles.explanationBox}>
                <Text style={styles.explanationContent}>{explanation}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Fixed Bottom Navigation (Previous & Next) ── */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navButton, !hasPrevious && styles.navButtonDisabled]}
          onPress={onPrevious}
          disabled={!hasPrevious}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={hasPrevious ? colors.text : colors.textMuted}
          />
          <Text
            style={[styles.navButtonText, !hasPrevious && styles.navButtonTextDisabled]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButtonPrimary, !hasNext && styles.navButtonPrimaryDone]}
          onPress={onNext}
          activeOpacity={0.85}
        >
          <Text style={styles.navButtonPrimaryText}>
            {hasNext ? 'Next Question' : 'Last Question'}
          </Text>
          <Ionicons
            name={hasNext ? 'chevron-forward' : 'checkmark-done'}
            size={18}
            color={colors.textLight}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  paginationBar: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  counterHighlight: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  miniTrack: {
    height: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  miniFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  jumpRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  jumpPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpPillCurrent: {
    backgroundColor: colors.primaryDeep,
    borderColor: colors.primary,
  },
  jumpPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  jumpPillTextCurrent: {
    color: colors.primaryMuted,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 3,
  },
  badgeBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  difficultyBadge: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  bloomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    gap: 3,
  },
  bloomBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.accentDark,
  },
  visualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    gap: 3,
  },
  visualBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
    textTransform: 'capitalize',
  },
  refBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  refText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 10,
    marginTop: 6,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  optionRowSelected: {
    borderColor: colors.accent,
  },
  optionRowCorrect: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  optionLetterBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionLetterBoxSelected: {
    borderColor: colors.accent,
  },
  optionLetterBoxCorrect: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionLetterText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  optionLetterTextCorrect: {
    color: colors.textLight,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
    lineHeight: 20,
  },
  optionTextCorrect: {
    color: colors.primaryDeep,
    fontWeight: '700',
  },
  correctIcon: {
    marginLeft: 'auto',
  },
  explanationSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  explanationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  explanationHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accentDark,
  },
  explanationBox: {
    backgroundColor: colors.accentMuted,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    marginTop: 8,
  },
  explanationContent: {
    fontSize: 12,
    color: colors.accentDark,
    lineHeight: 18,
    fontWeight: '500',
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  navButtonPrimary: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 10,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtonPrimaryDone: {
    backgroundColor: colors.primaryDeep,
  },
  navButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textLight,
  },
});
