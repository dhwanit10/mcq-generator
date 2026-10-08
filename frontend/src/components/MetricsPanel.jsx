import React from 'react';
import { BarChart3, Clock, CheckCircle2, XCircle, Zap, RotateCcw } from 'lucide-react';
import PlotlyRenderer from './PlotlyRenderer';

export default function MetricsPanel({ metrics }) {
  if (!metrics) return null;

  const {
    requested_questions,
    generated_candidates = 0,
    accepted_questions = 0,
    rejected_questions = 0,
    retries = 0,
    concurrency,
    batch_size,
    generation_mode,
    extraction_time_ms = 0,
    prompt_prep_time_ms = 0,
    total_time_ms = 0,
    time_to_first_question_ms,
    time_to_25_questions_ms,
    time_to_50_questions_ms,
    time_to_100_questions_ms,
    batch_latencies_ms = []
  } = metrics;

  const formatMs = (ms) => (ms != null ? `${(ms / 1000).toFixed(2)}s` : 'N/A');

  // Build Plotly chart data for batch latencies
  const plotData = batch_latencies_ms.length > 0 ? {
    data: [{
      x: batch_latencies_ms.map((_, i) => `Batch ${i + 1}`),
      y: batch_latencies_ms.map(ms => Number((ms / 1000).toFixed(2))),
      type: 'bar',
      marker: {
        color: '#990000',
        line: { color: '#0B192C', width: 1 }
      }
    }],
    layout: {
      title: { text: 'Individual Batch Generation Latencies (seconds)', font: { size: 14, color: '#0B192C' } },
      xaxis: { title: 'Batch Number' },
      yaxis: { title: 'Latency (s)' },
      margin: { l: 40, r: 20, t: 40, b: 40 }
    }
  } : null;

  return (
    <div style={{
      backgroundColor: '#FFFDF9',
      border: '2px solid #0B192C',
      padding: '1.5rem',
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
        <BarChart3 size={20} color="#990000" />
        Backend Throughput & Timing Metrics ({generation_mode?.toUpperCase()} Mode)
      </h2>

      {/* Summary KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Time */}
        <div style={{ backgroundColor: '#F8F4EC', border: '1px solid #0B192C', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2C3E55', textTransform: 'uppercase' }}>
            Total Generation Time
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#990000', marginTop: '0.2rem' }}>
            {formatMs(total_time_ms)}
          </div>
        </div>

        {/* Time to First Question */}
        <div style={{ backgroundColor: '#F8F4EC', border: '1px solid #0B192C', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2C3E55', textTransform: 'uppercase' }}>
            Time to 1st Question
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0B192C', marginTop: '0.2rem' }}>
            {formatMs(time_to_first_question_ms)}
          </div>
        </div>

        {/* Candidates vs Accepted */}
        <div style={{ backgroundColor: '#F8F4EC', border: '1px solid #0B192C', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2C3E55', textTransform: 'uppercase' }}>
            Accepted / Generated
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0B192C', marginTop: '0.2rem' }}>
            {accepted_questions} / {generated_candidates}
          </div>
        </div>

        {/* Rejections & Retries */}
        <div style={{ backgroundColor: '#F8F4EC', border: '1px solid #0B192C', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2C3E55', textTransform: 'uppercase' }}>
            Rejected / Over-Gen Retries
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#990000', marginTop: '0.2rem' }}>
            {rejected_questions} / {retries}
          </div>
        </div>
      </div>

      {/* Detailed Milestones & Execution Specs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem',
        fontSize: '0.88rem',
        marginBottom: '1rem'
      }}>
        {/* Milestone Milestones Table */}
        <div style={{ border: '1px solid #DFD5C4', padding: '1rem', backgroundColor: '#F8F4EC' }}>
          <div style={{ fontWeight: '700', color: '#0B192C', marginBottom: '0.5rem', borderBottom: '1px solid #DFD5C4', paddingBottom: '0.3rem' }}>
            Milestone Delivery Times
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span>Extraction & Prep Time:</span>
            <strong>{formatMs(extraction_time_ms + prompt_prep_time_ms)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span>Time to 25 Questions:</span>
            <strong>{formatMs(time_to_25_questions_ms)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span>Time to 50 Questions:</span>
            <strong>{formatMs(time_to_50_questions_ms)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Time to 100 Questions:</span>
            <strong>{formatMs(time_to_100_questions_ms)}</strong>
          </div>
        </div>

        {/* Execution Settings */}
        <div style={{ border: '1px solid #DFD5C4', padding: '1rem', backgroundColor: '#F8F4EC' }}>
          <div style={{ fontWeight: '700', color: '#0B192C', marginBottom: '0.5rem', borderBottom: '1px solid #DFD5C4', paddingBottom: '0.3rem' }}>
            Concurrency Parameters
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span>Mode:</span>
            <strong style={{ color: generation_mode === 'parallel' ? '#0B192C' : '#990000', textTransform: 'uppercase' }}>
              {generation_mode}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span>Max Concurrency:</span>
            <strong>{concurrency}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span>Batch Size:</span>
            <strong>{batch_size}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Batches Executed:</span>
            <strong>{batch_latencies_ms.length}</strong>
          </div>
        </div>
      </div>

      {/* Plotly Batch Latencies Bar Chart */}
      {plotData && <PlotlyRenderer plotData={plotData} />}
    </div>
  );
}
