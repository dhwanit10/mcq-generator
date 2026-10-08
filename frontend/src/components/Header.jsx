import React from 'react';
import { Cpu, Zap, Activity, BookOpen } from 'lucide-react';

export default function Header({ isHealthy, activeMode }) {
  return (
    <header style={{
      backgroundColor: '#0B192C',
      color: '#FFFDF9',
      borderBottom: '3px solid #990000',
      padding: '1.25rem 2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            backgroundColor: '#990000',
            color: '#FFFDF9',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0px'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.4rem',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              fontFamily: 'Georgia, serif'
            }}>
              High-Throughput AI MCQ Generator
            </h1>
            <p style={{
              margin: 0,
              fontSize: '0.82rem',
              color: '#DFD5C4',
              opacity: 0.9
            }}>
              Parallel LLM Generation & Realtime WebSocket Streaming
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Active Generation Mode Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: activeMode === 'parallel' ? '#162A45' : '#2A1F1D',
            color: '#FFFDF9',
            border: activeMode === 'parallel' ? '1px solid #DFD5C4' : '1px solid #990000',
            padding: '0.35rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {activeMode === 'parallel' ? <Zap size={14} color="#FFFDF9" /> : <Cpu size={14} color="#990000" />}
            <span>{activeMode} Generation</span>
          </div>

          {/* System Health Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: '#13243A',
            border: '1px solid #DFD5C4',
            padding: '0.35rem 0.75rem',
            fontSize: '0.8rem',
            color: '#FFFDF9'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              backgroundColor: isHealthy ? '#FFFDF9' : '#990000',
              borderRadius: '50%',
              display: 'inline-block'
            }} />
            <span>{isHealthy ? 'Backend Ready' : 'Connecting...'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
