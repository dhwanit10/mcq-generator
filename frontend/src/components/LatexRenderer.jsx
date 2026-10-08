import React from 'react';
import katex from 'katex';

/**
 * Parses and renders LaTeX expressions in text smoothly using KaTeX.
 * Handles inline math \( ... \) or $ ... $ and block math \[ ... \] or $$ ... $$.
 */
export default function LatexRenderer({ text = "", className = "" }) {
  if (!text) return null;

  // Split string into text chunks and latex math blocks
  const renderFormattedText = (str) => {
    // Regex for block math $$...$$ or \[...\] and inline math $...$ or \(...\)
    const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([\s\S]+?\\\))/g;

    const parts = str.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      let isBlock = false;
      let mathContent = null;

      if (part.startsWith('$$') && part.endsWith('$$')) {
        isBlock = true;
        mathContent = part.slice(2, -2);
      } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
        isBlock = true;
        mathContent = part.slice(2, -2);
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        isBlock = false;
        mathContent = part.slice(1, -1);
      } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
        isBlock = false;
        mathContent = part.slice(2, -2);
      }

      if (mathContent !== null) {
        try {
          const html = katex.renderToString(mathContent, {
            displayMode: isBlock,
            throwOnError: false
          });
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <span key={index}>{part}</span>;
        }
      }

      return <span key={index}>{part}</span>;
    });
  };

  return <span className={className}>{renderFormattedText(text)}</span>;
}
