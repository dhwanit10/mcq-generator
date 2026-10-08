import React from 'react';
import { Loader2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function ProgressBar({
  status,
  acceptedCount,
  totalRequested,
  elapsedSeconds,
  errorMessage
}) {
  const percentage = totalRequested > 0 ? Math.min(100, Math.round((acceptedCount / totalRequested) * 100)) : 0;

  let statusBg = '#0B192C';
  let statusText = 'Processing Batches';

  if (status === 'completed') {
    statusBg = '#0B192C';
    statusText = 'Generation Completed';
  } else if (status === 'error') {
    statusBg = '#990000';
    statusText = 'Generation Failed';
  } else if (acceptedCount > 0 && acceptedCount < totalRequested) {
    statusText = 'Streaming Valid Questions...';
  }

  return (
    <div style={{
      backgroundColor: '#FFFDF9',
      border: '2px solid #0B192C',
      padding: '1.25rem 1.5rem',
      marginBottom: '2rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {status === 'processing' && <Loader2 className="animate-spin" size={20} color="#990000" />}
          {status === 'completed' && <CheckCircle size={20} color="#0B192C" />}
          {status === 'error' && <AlertTriangle size={20} color="#990000" />}

          <span style={{ fontWeight: '700', fontSize: '1rem', color: '#0B192C', fontFamily: 'Georgia, serif' }}>
            {statusText}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.88rem', fontWeight: '600' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#2C3E55' }}>
            <Clock size={16} color="#990000" />
            <span>Elapsed: {elapsedSeconds}s</span>
          </div>

          <div style={{ color: '#0B192C' }}>
            <span style={{ fontSize: '1.1rem', color: '#990000', fontWeight: '800' }}>{acceptedCount}</span> / {totalRequested} Valid Questions
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div style={{
        width: '100%',
        height: '14px',
        backgroundColor: '#EFE8DA',
        border: '1px solid #0B192C',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          backgroundColor: status === 'error' ? '#990000' : '#0B192C',
          transition: 'width 0.3s ease-in-out'
        }} />
      </div>

      {errorMessage && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: '#F9ECEC',
          border: '1px solid #990000',
          color: '#990000',
          fontSize: '0.85rem',
          fontWeight: '600'
        }}>
          Error: {errorMessage}
        </div>
      )}
    </div>
  );
}
