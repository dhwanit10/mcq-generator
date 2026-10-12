import React, { useEffect, useRef, useState } from 'react';
import SmilesDrawer from 'smiles-drawer';

/**
 * Renders chemical molecular structures using SmilesDrawer.
 * Preserves SmilesDrawer's native centered viewBox for complete structure visibility.
 * Adheres strictly to the cream/navy/crimson palette with zero latency.
 */
export default function SmilesRenderer({ smiles }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!smiles || !containerRef.current) return;
    setError(false);

    try {
      const drawerWidth = 360;
      const drawerHeight = 240;

      const drawer = new SmilesDrawer.SvgDrawer({
        width: drawerWidth,
        height: drawerHeight,
        bondThickness: 1.5,
        padding: 20,
        themes: {
          light: {
            C: '#0B192C',
            O: '#990000',
            N: '#0B192C',
            F: '#0B192C',
            CL: '#0B192C',
            BR: '#990000',
            I: '#990000',
            P: '#990000',
            S: '#990000',
            B: '#0B192C',
            SI: '#0B192C',
            H: '#0B192C',
            BACKGROUND: 'transparent'
          }
        }
      });

      SmilesDrawer.parse(
        smiles,
        (tree) => {
          try {
            const svg = drawer.draw(tree, null, 'light');
            if (containerRef.current && svg) {
              // Preserve the native viewBox calculated by SmilesDrawer so the molecule is fully centered
              svg.style.width = '100%';
              svg.style.height = 'auto';
              svg.style.maxWidth = `${drawerWidth}px`;
              svg.style.maxHeight = `${drawerHeight}px`;
              svg.style.display = 'block';
              svg.style.margin = '0 auto';

              containerRef.current.innerHTML = '';
              containerRef.current.appendChild(svg);
            }
          } catch (err) {
            console.warn('[SmilesRenderer] Render error:', err);
            setError(true);
          }
        },
        (err) => {
          console.warn('[SmilesRenderer] Parse error for SMILES:', smiles, err);
          setError(true);
        }
      );
    } catch (e) {
      console.warn('[SmilesRenderer] Init error:', e);
      setError(true);
    }
  }, [smiles]);

  if (!smiles) return null;

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
        <span style={{
          fontSize: '0.75rem',
          fontWeight: '700',
          color: '#990000',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Chemical Structure
        </span>
        <span style={{
          fontSize: '0.72rem',
          fontFamily: 'monospace',
          color: '#0B192C',
          backgroundColor: '#F8F4EC',
          padding: '0.15rem 0.5rem',
          border: '1px solid #DFD5C4',
          wordBreak: 'break-all'
        }}>
          {smiles}
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          minHeight: '220px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FBF9F4',
          padding: '1rem',
          boxSizing: 'border-box'
        }}
      >
        {error ? (
          <div style={{
            fontSize: '0.8rem',
            color: '#990000',
            fontStyle: 'italic',
            textAlign: 'center'
          }}>
            Structure rendering unavailable for: <code style={{ fontFamily: 'monospace' }}>{smiles}</code>
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: '#0B192C' }}>
            Depicting molecular structure...
          </div>
        )}
      </div>
    </div>
  );
}
