import React, { useState } from 'react';
import { Upload, Sliders, Zap, FileText, CheckCircle2, Database } from 'lucide-react';

export default function GenerationForm({ onSubmit, isSubmitting }) {
  // Source mode
  const [sourceMode, setSourceMode] = useState('pdf'); // 'pdf' | 'notes'

  // PDF mode
  const [file, setFile] = useState(null);

  // Notes/RAG mode
  const [subject, setSubject] = useState('maths');
  const [topic, setTopic] = useState('');

  // Common params
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [bloomLevel, setBloomLevel] = useState('apply');
  const [generationMode, setGenerationMode] = useState('parallel');
  const [questionsPerBatch, setQuestionsPerBatch] = useState(10);
  const [maxConcurrentRequests, setMaxConcurrentRequests] = useState(5);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const isSubmitDisabled = isSubmitting || (sourceMode === 'pdf' && !file);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    const common = {
      numberOfQuestions: Number(numberOfQuestions),
      difficulty,
      bloomLevel,
      generationMode,
      questionsPerBatch: Number(questionsPerBatch),
      maxConcurrentRequests: Number(maxConcurrentRequests),
    };

    if (sourceMode === 'pdf') {
      onSubmit({ mode: 'pdf', file, ...common });
    } else {
      onSubmit({ mode: 'notes', subject, topic: topic.trim() || null, ...common });
    }
  };

  const fieldStyle = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    backgroundColor: '#F8F4EC',
    border: '1px solid #0B192C',
    color: '#0B192C',
    fontWeight: '600',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    fontWeight: '600',
    marginBottom: '0.3rem',
    fontSize: '0.85rem',
    color: '#0B192C',
  };

  return (
    <form onSubmit={handleFormSubmit} style={{
      backgroundColor: '#FFFDF9',
      border: '2px solid #0B192C',
      padding: '1.75rem',
      marginBottom: '2rem'
    }}>
      {/* Title */}
      <h2 style={{
        margin: '0 0 1.25rem 0',
        fontSize: '1.2rem',
        fontWeight: '700',
        color: '#0B192C',
        fontFamily: 'Georgia, serif',
        borderBottom: '1px solid #DFD5C4',
        paddingBottom: '0.6rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <FileText size={20} color="#990000" />
        Configure MCQ Generation
      </h2>

      {/* ── Source Mode Toggle ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Generation Source</label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setSourceMode('pdf')}
            style={{
              flex: 1,
              padding: '0.6rem 0.8rem',
              backgroundColor: sourceMode === 'pdf' ? '#0B192C' : '#F8F4EC',
              color: sourceMode === 'pdf' ? '#FFFDF9' : '#0B192C',
              border: '1px solid #0B192C',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <Upload size={14} />
            Upload PDF
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('notes')}
            style={{
              flex: 1,
              padding: '0.6rem 0.8rem',
              backgroundColor: sourceMode === 'notes' ? '#990000' : '#F8F4EC',
              color: sourceMode === 'notes' ? '#FFFDF9' : '#0B192C',
              border: '1px solid #0B192C',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <Database size={14} />
            From Indexed Notes
          </button>
        </div>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#2C3E55' }}>
          {sourceMode === 'pdf'
            ? 'Upload a PDF — text is extracted on-the-fly and sent directly to the LLM.'
            : 'Retrieves evidence from notes already indexed via the Index Notes tab. No re-upload needed.'}
        </p>
      </div>

      {/* ── PDF Upload Area ── */}
      {sourceMode === 'pdf' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>
            PDF Study Material <span style={{ color: '#990000' }}>*</span>
          </label>
          <div
            onClick={() => document.getElementById('gen-pdf-file-input').click()}
            style={{
              border: file ? '2px solid #0B192C' : '2px dashed #C8BBA7',
              backgroundColor: file ? '#F9ECEC' : '#F8F4EC',
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
          >
            <input
              id="gen-pdf-file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#0B192C', fontWeight: '600' }}>
                <CheckCircle2 size={20} color="#990000" />
                <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <div>
                <Upload size={32} color="#0B192C" style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontWeight: '600', color: '#0B192C' }}>
                  Click to browse or drop your PDF here
                </p>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#2C3E55' }}>
                  Textbooks, lecture notes, research papers (.pdf)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Notes / RAG Source Fields ── */}
      {sourceMode === 'notes' && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#F8F4EC',
          border: '1px solid #DFD5C4',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          <div>
            <label style={labelStyle}>
              Subject <span style={{ color: '#990000' }}>*</span>
            </label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={fieldStyle}>
              <option value="maths">Maths</option>
              <option value="chemistry">Chemistry</option>
              <option value="physics">Physics</option>
              <option value="biology">Biology</option>
            </select>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#2C3E55' }}>
              Must match the subject used when indexing.
            </p>
          </div>
          <div>
            <label style={labelStyle}>
              Topic <span style={{ fontSize: '0.75rem', color: '#2C3E55', fontWeight: '400' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. integration, thermodynamics"
              style={fieldStyle}
            />
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#2C3E55' }}>
              Narrows retrieval to a specific topic.
            </p>
          </div>
        </div>
      )}

      {/* ── Main Parameters Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        {/* Number of Questions */}
        <div>
          <label style={labelStyle}>Number of Questions</label>
          <input
            type="number"
            min="1"
            max="500"
            value={numberOfQuestions}
            onChange={(e) => setNumberOfQuestions(e.target.value)}
            style={fieldStyle}
          />
        </div>

        {/* Difficulty */}
        <div>
          <label style={labelStyle}>Difficulty Level</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={fieldStyle}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Bloom's Level */}
        <div>
          <label style={labelStyle}>Bloom's Taxonomy Level</label>
          <select value={bloomLevel} onChange={(e) => setBloomLevel(e.target.value)} style={fieldStyle}>
            <option value="remember">Remember</option>
            <option value="understand">Understand</option>
            <option value="apply">Apply</option>
            <option value="analyze">Analyze</option>
            <option value="evaluate">Evaluate</option>
            <option value="create">Create</option>
          </select>
        </div>

        {/* Generation Mode */}
        <div>
          <label style={labelStyle}>Execution Mode</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setGenerationMode('parallel')}
              style={{
                flex: 1,
                padding: '0.6rem',
                backgroundColor: generationMode === 'parallel' ? '#0B192C' : '#F8F4EC',
                color: generationMode === 'parallel' ? '#FFFDF9' : '#0B192C',
                border: '1px solid #0B192C',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.8rem',
              }}
            >
              Parallel
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode('sequential')}
              style={{
                flex: 1,
                padding: '0.6rem',
                backgroundColor: generationMode === 'sequential' ? '#990000' : '#F8F4EC',
                color: generationMode === 'sequential' ? '#FFFDF9' : '#0B192C',
                border: '1px solid #0B192C',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.8rem',
              }}
            >
              Sequential
            </button>
          </div>
        </div>
      </div>

      {/* ── Advanced Settings ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: '#990000',
            fontWeight: '600',
            fontSize: '0.85rem',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <Sliders size={14} />
          {isAdvancedOpen ? 'Hide Concurrency & Batch Settings' : 'Configure Concurrency & Batch Settings'}
        </button>

        {isAdvancedOpen && (
          <div style={{
            marginTop: '0.75rem',
            padding: '1rem',
            backgroundColor: '#F8F4EC',
            border: '1px solid #DFD5C4',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#0B192C', marginBottom: '0.2rem' }}>
                Questions Per Batch: {questionsPerBatch}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={questionsPerBatch}
                onChange={(e) => setQuestionsPerBatch(e.target.value)}
                style={{ width: '100%', accentColor: '#990000' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#0B192C', marginBottom: '0.2rem' }}>
                Max Concurrent Requests: {maxConcurrentRequests}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={maxConcurrentRequests}
                onChange={(e) => setMaxConcurrentRequests(e.target.value)}
                style={{ width: '100%', accentColor: '#0B192C' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Submit Button ── */}
      <button
        type="submit"
        disabled={isSubmitDisabled}
        style={{
          width: '100%',
          padding: '0.9rem',
          backgroundColor: isSubmitDisabled ? '#DFD5C4' : '#990000',
          color: isSubmitDisabled ? '#0B192C' : '#FFFDF9',
          border: '2px solid #0B192C',
          fontWeight: '700',
          fontSize: '1rem',
          letterSpacing: '0.03em',
          cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <Zap size={18} />
        {isSubmitting
          ? 'Initiating Job & Connecting WebSocket...'
          : sourceMode === 'pdf'
            ? 'Start MCQ Generation from PDF'
            : 'Generate MCQs from Indexed Notes'}
      </button>
    </form>
  );
}
