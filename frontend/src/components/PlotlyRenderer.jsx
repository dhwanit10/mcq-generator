import React from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';

const Plot = createPlotlyComponent(Plotly);

/**
 * Checks question text or explicit plot specs for JSON chart data and renders interactive graphs.
 * Styled strictly matching Cream/Navy/Crimson color theme.
 */
export default function PlotlyRenderer({ plotData, text = "" }) {
  let parsedPlot = plotData;

  // Attempt to parse JSON plotly spec from text if not passed directly
  if (!parsedPlot && text && text.includes('"data"') && text.includes('"layout"')) {
    try {
      const match = text.match(/\{[\s\S]*"data"[\s\S]*"layout"[\s\S]*\}/);
      if (match) {
        parsedPlot = JSON.parse(match[0]);
      }
    } catch (e) {
      // Ignore parse failure
    }
  }

  if (!parsedPlot || !parsedPlot.data) return null;

  // Enforce Cream/Navy theme styling on layout
  const themeLayout = {
    autosize: true,
    paper_bgcolor: '#FFFDF9',
    plot_bgcolor: '#F6F2E9',
    margin: { l: 40, r: 20, t: 30, b: 40 },
    font: {
      color: '#0B192C',
      family: 'system-ui, sans-serif'
    },
    xaxis: {
      gridcolor: '#DFD5C4',
      zerolinecolor: '#0B192C'
    },
    yaxis: {
      gridcolor: '#DFD5C4',
      zerolinecolor: '#0B192C'
    },
    ...parsedPlot.layout
  };

  return (
    <div style={{
      margin: '1rem 0',
      border: '1px solid #DFD5C4',
      backgroundColor: '#FFFDF9',
      padding: '0.5rem',
      borderRadius: '0px'
    }}>
      <Plot
        data={parsedPlot.data}
        layout={themeLayout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: '300px' }}
      />
    </div>
  );
}
