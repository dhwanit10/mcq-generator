import React, { useState } from 'react';
import { Upload, BookOpen, CheckCircle2, Loader2, AlertTriangle, Database } from 'lucide-react';

export default function NotesUploadForm({ apiBase }) {
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('maths');
  const [topic, setTopic] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null); // { status, message, ... }
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);
    if (topic.trim()) formData.append('topic', topic.trim().toLowerCase());
    if (documentTitle.trim()) formData.append('document_title', documentTitle.trim());

    try {
      const response = await fetch(`${apiBase}/api/v1/notes/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed.');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
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
    <form onSubmit={handleUpload} style={{
      backgroundColor: '#FFFDF9',
      border: '2px solid #0B192C',
      padding: '1.75rem',
      marginBottom: '2rem'
    }}>
      {/* Section Title */}
      <h2 style={{
        margin: '0 0 0.4rem 0',
        fontSize: '1.2rem',
        fontWeight: '700',
        color: '#0B192C',
        fontFamily: 'Georgia, serif',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Database size={20} color="#990000" />
        Index Study Notes into Vector Store
      </h2>
      <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: '#2C3E55', borderBottom: '1px solid #DFD5C4', paddingBottom: '0.85rem' }}>
        Upload a PDF study document to extract, chunk, embed, and persist it in the Qdrant vector store.
        Once indexed, use the <strong>Generate from Notes</strong> tab to produce MCQs without re-uploading.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Subject */}
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
        </div>

        {/* Topic */}
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
        </div>

        {/* Document Title */}
        <div>
          <label style={labelStyle}>
            Document Title <span style={{ fontSize: '0.75rem', color: '#2C3E55', fontWeight: '400' }}>(optional)</span>
          </label>
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            placeholder="e.g. Physics Chapter 3"
            style={fieldStyle}
          />
        </div>
      </div>

      {/* File Upload */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={labelStyle}>
          PDF Document <span style={{ color: '#990000' }}>*</span>
        </label>
        <div
          onClick={() => document.getElementById('notes-file-input').click()}
          style={{
            border: file ? '2px solid #0B192C' : '2px dashed #C8BBA7',
            backgroundColor: file ? '#F4F8EC' : '#F8F4EC',
            padding: '1.25rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s, background-color 0.2s'
          }}
        >
          <input
            id="notes-file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#0B192C', fontWeight: '600' }}>
              <CheckCircle2 size={18} color="#0B192C" />
              <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          ) : (
            <div>
              <Upload size={28} color="#0B192C" style={{ marginBottom: '0.4rem' }} />
              <p style={{ margin: 0, fontWeight: '600', color: '#0B192C', fontSize: '0.9rem' }}>
                Click to select a PDF to index
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Button */}
      <button
        type="submit"
        disabled={!file || isUploading}
        style={{
          width: '100%',
          padding: '0.85rem',
          backgroundColor: !file || isUploading ? '#DFD5C4' : '#0B192C',
          color: !file || isUploading ? '#0B192C' : '#FFFDF9',
          border: '2px solid #0B192C',
          fontWeight: '700',
          fontSize: '0.95rem',
          letterSpacing: '0.03em',
          cursor: !file || isUploading ? 'not-allowed' : 'pointer',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        {isUploading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <BookOpen size={18} />}
        {isUploading ? 'Extracting, Embedding & Indexing...' : 'Index Document into Vector Store'}
      </button>

      {/* Success Result */}
      {result && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: result.status === 'already_indexed' ? '#F8F4EC' : '#EEF8EE',
          border: `1px solid ${result.status === 'already_indexed' ? '#DFD5C4' : '#0B192C'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CheckCircle2 size={16} color="#0B192C" />
            <span style={{ fontWeight: '700', color: '#0B192C', fontSize: '0.9rem' }}>
              {result.status === 'already_indexed' ? 'Already Indexed' : 'Successfully Indexed'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', fontSize: '0.82rem' }}>
            {[
              ['Document', result.document_title],
              ['Subject', result.subject],
              ['Topic', result.topic || '—'],
              ['Pages', result.total_pages],
              ['Chunks', result.total_chunks],
              ['Doc ID', result.document_id],
            ].map(([k, v]) => (
              <div key={k} style={{ backgroundColor: '#FFFDF9', padding: '0.4rem 0.6rem', border: '1px solid #DFD5C4' }}>
                <div style={{ fontSize: '0.72rem', color: '#2C3E55', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
                <div style={{ color: '#0B192C', fontWeight: '700', marginTop: '0.1rem', wordBreak: 'break-all' }}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '0.6rem 0.75rem',
          backgroundColor: '#F9ECEC',
          border: '1px solid #990000',
          color: '#990000',
          fontSize: '0.85rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
    </form>
  );
}
