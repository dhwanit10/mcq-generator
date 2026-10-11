import React from 'react';
import PlotlyRenderer from './PlotlyRenderer';
import SmilesRenderer from './SmilesRenderer';
import DiagramRenderer from './DiagramRenderer';

/**
 * Universal Visual Renderer for MCQ questions.
 * Inspects question metadata and renders:
 * - 'graph' -> Interactive Plotly chart (Maths/Physics)
 * - 'structure' -> Chemical structure via SMILES (Chemistry)
 * - 'diagram' -> Biological diagrams & images (Biology)
 *
 * Runs with 0 latency using synchronous client-side rendering modules.
 */
export default function VisualRenderer({
  hasVisual = false,
  visualType = null,
  visualData = null,
  qText = ''
}) {
  // If no explicit visual flag and no visual data, check text for embedded plotly spec fallback
  if (!hasVisual && !visualData && !visualType) {
    if (qText && qText.includes('"data"') && qText.includes('"layout"')) {
      return <PlotlyRenderer text={qText} />;
    }
    return null;
  }

  // 1. Chemical Structure (SMILES)
  if (visualType === 'structure' || (visualData && visualData.smiles)) {
    return <SmilesRenderer smiles={visualData?.smiles} />;
  }

  // 2. Interactive Graph (Plotly)
  if (visualType === 'graph' || (visualData && visualData.plotly_spec)) {
    return <PlotlyRenderer plotData={visualData?.plotly_spec} text={qText} />;
  }

  // 3. Biological Diagram / Image
  if (
    visualType === 'diagram' ||
    (visualData && (visualData.diagram_name || (visualData.diagram_links && visualData.diagram_links.length > 0)))
  ) {
    return (
      <DiagramRenderer
        diagramName={visualData?.diagram_name}
        diagramLinks={visualData?.diagram_links}
        keywords={visualData?.diagram_keywords}
      />
    );
  }

  // 4. Fallback text Plotly parse
  if (qText && qText.includes('"data"') && qText.includes('"layout"')) {
    return <PlotlyRenderer text={qText} />;
  }

  return null;
}
