import React, { useState } from 'react';
import { Upload, Sliders, Zap, FileText, CheckCircle2 } from 'lucide-react';

export default function GenerationForm({ onSubmit, isSubmitting }) {
  const [file, setFile] = useState(null);
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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!file) return;

    onSubmit({
      file,
      numberOfQuestions: Number(numberOfQuestions),
      difficulty,
      bloomLevel,
      generationMode,
      questionsPerBatch: Number(questionsPerBatch),
      maxConcurrentRequests: Number(maxConcurrentRequests)
    });
  };

  return (
    <form onSubmit={handleFormSubmit} style={{
      backgroundColor: '#FFFDF9',
      border: '2px solid #0B192C',
      padding: '1.75rem',
      marginBottom: '2rem'
    }}>
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
        Configure Generation Parameters
      </h2>

      {/* File Upload Drag & Drop Area */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.4rem', color: '#0B192C', fontSize: '0.9rem' }}>
          Upload PDF Study Material <span style={{ color: '#990000' }}>*</span>
        </label>
        <div
          onClick={() => document.getElementById('pdf-file-input').click()}
          style={{
            border: file ? '2px solid #0B192C' : '2px dashed #C8BBA7',
            backgroundColor: file ? '#F9ECEC' : '#F8F4EC',
            padding: '1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s, background-color 0.2s'
          }}
        >
          <input
            id="pdf-file-input"
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
                Click to browse or drop your PDF document here
              </p>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#2C3E55' }}>
                Supports textbooks, lecture notes, and research papers (.pdf)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Parameters Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        {/* Number of Questions */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem', color: '#0B192C' }}>
            Number of Questions
          </label>
          <input
            type="number"
            min="1"
            max="500"
            value={numberOfQuestions}
            onChange={(e) => setNumberOfQuestions(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              backgroundColor: '#F8F4EC',
              border: '1px solid #0B192C',
              color: '#0B192C',
              fontWeight: '600'
            }}
          />
        </div>

        {/* Difficulty */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem', color: '#0B192C' }}>
            Difficulty Level
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              backgroundColor: '#F8F4EC',
              border: '1px solid #0B192C',
              color: '#0B192C',
              fontWeight: '600'
            }}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Bloom's Level */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem', color: '#0B192C' }}>
            Bloom's Taxonomy Level
          </label>
          <select
            value={bloomLevel}
            onChange={(e) => setBloomLevel(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              backgroundColor: '#F8F4EC',
              border: '1px solid #0B192C',
              color: '#0B192C',
              fontWeight: '600'
            }}
          >
            <option value="remember">Remember</option>
            <option value="understand">Understand</option>
            <option value="apply">Apply</option>
            <option value="analyze">Analyze</option>
            <option value="evaluate">Evaluate</option>
            <option value="create">Create</option>
          </select>
        </div>

        {/* Generation Mode Selector */}
        <div>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem', color: '#0B192C' }}>
            Execution Architecture Mode
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setGenerationMode('parallel')}
              style={{
                flex: 1,
                padding: '0.55rem',
                backgroundColor: generationMode === 'parallel' ? '#0B192C' : '#F8F4EC',
                color: generationMode === 'parallel' ? '#FFFDF9' : '#0B192C',
                border: '1px solid #0B192C',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.8rem'
              }}
            >
              Parallel
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode('sequential')}
              style={{
                flex: 1,
                padding: '0.55rem',
                backgroundColor: generationMode === 'sequential' ? '#990000' : '#F8F4EC',
                color: generationMode === 'sequential' ? '#FFFDF9' : '#0B192C',
                border: '1px solid #0B192C',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.8rem'
              }}
            >
              Sequential
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Settings Toggle */}
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
            gap: '0.3rem'
          }}
        >
          <Sliders size={14} />
          {isAdvancedOpen ? 'Hide Concurrency & Batch Settings' : 'Configure Advanced Concurrency & Batch Settings'}
        </button>

        {isAdvancedOpen && (
          <div style={{
            marginTop: '0.75rem',
            padding: '1rem',
            backgroundColor: '#F8F4EC',
            border: '1px solid #DFD5C4',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
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

      {/* Submit Action Button */}
      <button
        type="submit"
        disabled={!file || isSubmitting}
        style={{
          width: '100%',
          padding: '0.9rem',
          backgroundColor: !file || isSubmitting ? '#DFD5C4' : '#990000',
          color: !file || isSubmitting ? '#0B192C' : '#FFFDF9',
          border: '2px solid #0B192C',
          fontWeight: '700',
          fontSize: '1rem',
          letterSpacing: '0.03em',
          cursor: !file || isSubmitting ? 'not-allowed' : 'pointer',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        <Zap size={18} />
        {isSubmitting ? 'Initiating Job & Connecting WebSocket...' : 'Start High-Throughput MCQ Generation'}
      </button>
    </form>
  );
}
