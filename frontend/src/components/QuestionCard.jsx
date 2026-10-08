import React from 'react';
import LatexRenderer from './LatexRenderer';
import PlotlyRenderer from './PlotlyRenderer';
import { CheckCircle2, Bookmark, Award } from 'lucide-react';

export default function QuestionCard({ question, index }) {
  if (!question) return null;

  const {
    question: qText,
    options = [],
    correct_option,
    explanation,
    difficulty,
    bloom_level,
    source_reference
  } = question;

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div style={{
      backgroundColor: '#FFFDF9',
      border: '2px solid #0B192C',
      padding: '1.5rem',
      marginBottom: '1.25rem',
      position: 'relative'
    }}>
      {/* Header Badges Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
        borderBottom: '1px solid #DFD5C4',
        paddingBottom: '0.6rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            backgroundColor: '#0B192C',
            color: '#FFFDF9',
            padding: '0.2rem 0.6rem',
            fontWeight: '700',
            fontSize: '0.85rem'
          }}>
            Q{index + 1}
          </span>

          <span style={{
            backgroundColor: '#F8F4EC',
            color: '#0B192C',
            border: '1px solid #0B192C',
            padding: '0.15rem 0.5rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'capitalize'
          }}>
            {difficulty || 'medium'}
          </span>

          <span style={{
            backgroundColor: '#F9ECEC',
            color: '#990000',
            border: '1px solid #990000',
            padding: '0.15rem 0.5rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'capitalize',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Award size={12} />
            Bloom: {bloom_level || 'apply'}
          </span>
        </div>

        {source_reference && (
          <div style={{
            fontSize: '0.78rem',
            color: '#2C3E55',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Bookmark size={14} color="#990000" />
            <span>Ref: {source_reference}</span>
          </div>
        )}
      </div>

      {/* Question Text with KaTeX Latex rendering */}
      <h3 style={{
        margin: '0 0 1.25rem 0',
        fontSize: '1.05rem',
        fontWeight: '600',
        color: '#0B192C',
        lineHeight: 1.5,
        fontFamily: 'Georgia, serif'
      }}>
        <LatexRenderer text={qText} />
      </h3>

      {/* Plotly Graph if question text contains plot data */}
      <PlotlyRenderer text={qText} />

      {/* Options List */}
      <div style={{ display: 'grid', gap: '0.65rem', marginBottom: '1.25rem' }}>
        {options.map((opt, i) => {
          const isCorrect = i === correct_option;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                backgroundColor: isCorrect ? '#F9ECEC' : '#F8F4EC',
                border: isCorrect ? '2px solid #990000' : '1px solid #DFD5C4',
                color: isCorrect ? '#0B192C' : '#1E2A38',
                fontWeight: isCorrect ? '700' : '400'
              }}
            >
              <span style={{
                backgroundColor: isCorrect ? '#990000' : '#0B192C',
                color: '#FFFDF9',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: '700',
                flexShrink: 0
              }}>
                {optionLabels[i]}
              </span>

              <div style={{ flex: 1, fontSize: '0.92rem' }}>
                <LatexRenderer text={opt} />
              </div>

              {isCorrect && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#990000', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0 }}>
                  <CheckCircle2 size={16} />
                  <span>Correct Answer</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation Box */}
      {explanation && (
        <div style={{
          backgroundColor: '#F8F4EC',
          borderLeft: '4px solid #990000',
          borderTop: '1px solid #DFD5C4',
          borderRight: '1px solid #DFD5C4',
          borderBottom: '1px solid #DFD5C4',
          padding: '0.75rem 1rem',
          fontSize: '0.85rem',
          color: '#0B192C'
        }}>
          <span style={{ fontWeight: '700', color: '#990000', marginRight: '0.4rem' }}>
            Explanation:
          </span>
          <LatexRenderer text={explanation} />
        </div>
      )}
    </div>
  );
}
