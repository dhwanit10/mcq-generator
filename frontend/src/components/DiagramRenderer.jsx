import React, { useState } from 'react';
import { Image as ImageIcon, ImageOff } from 'lucide-react';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL || 'http://localhost:8000';

/**
 * Renders biology diagrams or reference images with zero latency.
 * Resolves local backend image paths (/data/images/...) and full URLs (SerpAPI fallback).
 */
export default function DiagramRenderer({ diagramName, diagramLinks = [], keywords = [] }) {
  const [failedLinks, setFailedLinks] = useState({});

  const links = Array.isArray(diagramLinks)
    ? diagramLinks.filter(Boolean)
    : (diagramLinks ? [diagramLinks] : []);


  const resolveUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Relative path served by backend static mount
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  
  const handleImageError = (link) => {
    setFailedLinks((prev) => ({ ...prev, [link]: true }));
  };

  return (
    <div style={{
      margin: '1rem 0',
      border: '1px solid #DFD5C4',
      backgroundColor: '#FFFDF9',
      padding: '0.75rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.6rem',
        borderBottom: '1px solid #DFD5C4',
        paddingBottom: '0.4rem',
        flexWrap: 'wrap',
        gap: '0.4rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            color: '#990000',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Biological Diagram
          </span>
          {diagramName && (
            <span style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#0B192C'
            }}>
              — {diagramName}
            </span>
          )}
        </div>

        {keywords && keywords.length > 0 && (
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {keywords.slice(0, 3).map((kw, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.68rem',
                  backgroundColor: '#F8F4EC',
                  color: '#0B192C',
                  border: '1px solid #DFD5C4',
                  padding: '0.1rem 0.35rem'
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {links.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: links.length > 1 ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
          gap: '0.75rem',
          backgroundColor: '#FBF9F4',
          padding: '0.5rem'
        }}>
          {links.map((link, idx) => {
            const isFailed = failedLinks[link];
            const resolvedSrc = resolveUrl(link);

            if (isFailed) {
              return (
                <div
                  key={idx}
                  style={{
                    minHeight: '140px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed #990000',
                    backgroundColor: '#F9ECEC',
                    padding: '1rem',
                    textAlign: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <ImageOff size={22} color="#990000" />
                  <span style={{ fontSize: '0.8rem', color: '#990000', fontWeight: '600' }}>
                    {diagramName || 'Diagram image could not be loaded'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#2C3E55', wordBreak: 'break-all' }}>
                    Source: {link}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FFFDF9',
                  border: '1px solid #DFD5C4',
                  padding: '0.4rem'
                }}
              >
                <img
                  src={resolvedSrc}
                  alt={diagramName || `Diagram ${idx + 1}`}
                  loading="eager"
                  onError={() => handleImageError(link)}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '360px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
                {links.length > 1 && (
                  <span style={{
                    fontSize: '0.7rem',
                    color: '#0B192C',
                    marginTop: '0.35rem',
                    fontWeight: '600'
                  }}>
                    Figure {idx + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          minHeight: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FBF9F4',
          border: '1px dashed #DFD5C4',
          padding: '1rem',
          color: '#6E7C8C',
          fontSize: '0.85rem',
          fontStyle: 'italic',
          gap: '0.5rem'
        }}>
          <ImageOff size={18} color="#990000" />
          <span>No relevant images found</span>
        </div>
      )}
    </div>
  );
}
