import React, { useState } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';

const Plot = createPlotlyComponent(Plotly);

/**
 * Checks question text or explicit plot specs for JSON chart data and renders interactive graphs.
 * Styled strictly matching Cream/Navy/Crimson color theme.
 */
export default function PlotlyRenderer({ plotData, text = "" }) {
  const [hasError, setHasError] = useState(false);
  let parsedPlot = plotData;

  // Attempt to parse JSON string if passed as stringified JSON
  if (typeof parsedPlot === 'string') {
    try {
      parsedPlot = JSON.parse(parsedPlot);
    } catch (e) {
      // Ignore parse failure
    }
  }

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

  if (hasError || !parsedPlot || !parsedPlot.data || !Array.isArray(parsedPlot.data)) {
    return null;
  }

  // Enforce Cream/Navy theme styling on layout
  // const themeLayout = {
  //   autosize: true,
  //   paper_bgcolor: '#FFFDF9',
  //   plot_bgcolor: '#FBF9F4',
  //   margin: { l: 45, r: 25, t: 35, b: 45 },
  //   font: {
  //     color: '#0B192C',
  //     family: 'Georgia, serif, system-ui, sans-serif'
  //   },
  //   xaxis: {
  //     gridcolor: '#DFD5C4',
  //     zerolinecolor: '#0B192C',
  //     ...(parsedPlot.layout?.xaxis || {})
  //   },
  //   yaxis: {
  //     gridcolor: '#DFD5C4',
  //     zerolinecolor: '#0B192C',
  //     ...(parsedPlot.layout?.yaxis || {})
  //   },
  //   ...parsedPlot.layout
  // };


  // Normalize the incoming Plotly layout before applying the theme.
  const rawLayout = parsedPlot.layout || {};

  const themeLayout = {
    ...rawLayout,

    title:
      typeof rawLayout.title === "string"
        ? { text: rawLayout.title }
        : rawLayout.title,

    autosize: true,
    paper_bgcolor: "#FFFDF9",
    plot_bgcolor: "#FBF9F4",

    margin: { l: 45, r: 25, t: 50, b: 45 },

    font: {
      color: "#0B192C",
      family: "Georgia, serif, system-ui, sans-serif",
      ...(typeof rawLayout.font === "object"
        ? rawLayout.font
        : {}),
    },

    xaxis: {
      title: {
        text:
          typeof rawLayout.xaxis === "string"
            ? rawLayout.xaxis
            : typeof rawLayout.xaxis?.title === "string"
              ? rawLayout.xaxis.title
              : rawLayout.xaxis?.title?.text || "x",
      },
      gridcolor: "#DFD5C4",
      zerolinecolor: "#0B192C",
      ...(typeof rawLayout.xaxis === "object"
        ? rawLayout.xaxis
        : {}),
    },

    yaxis: {
      title: {
        text:
          typeof rawLayout.yaxis === "string"
            ? rawLayout.yaxis
            : typeof rawLayout.yaxis?.title === "string"
              ? rawLayout.yaxis.title
              : rawLayout.yaxis?.title?.text || "y",
      },
      gridcolor: "#DFD5C4",
      zerolinecolor: "#0B192C",
      ...(typeof rawLayout.yaxis === "object"
        ? rawLayout.yaxis
        : {}),
    },
  };

  return (
    <div style={{
      margin: '1rem 0',
      border: '1px solid #DFD5C4',
      backgroundColor: '#FFFDF9',
      padding: '0.75rem',
      borderRadius: '0px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.5rem',
        borderBottom: '1px solid #DFD5C4',
        paddingBottom: '0.4rem'
      }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: '700',
          color: '#990000',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Interactive Graph
        </span>
        {parsedPlot.layout?.title?.text && (
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: '#0B192C'
          }}>
            {parsedPlot.layout.title.text}
          </span>
        )}
      </div>

      <Plot
        data={parsedPlot.data}
        layout={themeLayout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: '320px' }}
        onError={(err) => {
          console.warn('[PlotlyRenderer] Error:', err);
          setHasError(true);
        }}
      />
    </div>
  );
}
