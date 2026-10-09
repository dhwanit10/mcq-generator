import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import NotesUploadForm from './components/NotesUploadForm';
import GenerationForm from './components/GenerationForm';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import MetricsPanel from './components/MetricsPanel';
import { RefreshCw, Database, Zap } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';
const WS_BASE_URL = 'ws://localhost:8000';

export default function App() {
  // ── App-level tab ──
  const [activeTab, setActiveTab] = useState('generate'); // 'index' | 'generate'

  // ── Backend health ──
  const [isHealthy, setIsHealthy] = useState(false);

  // ── Generation job state ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | started | processing | completed | partial | error
  const [totalRequested, setTotalRequested] = useState(0);
  const [acceptedQuestions, setAcceptedQuestions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeMode, setActiveMode] = useState('parallel');
  const [wsStatus, setWsStatus] = useState(null); // retrieval_started | retrieval_completed | generation_started | null

  const wsRef = useRef(null);
  const timerRef = useRef(null);

  // ── Health check on mount ──
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/health`);
      if (res.ok) {
        const data = await res.json();
        setIsHealthy(data.status === 'ok');
      } else {
        setIsHealthy(false);
      }
    } catch {
      setIsHealthy(false);
    }
  };

  // ── Elapsed timer ──
  useEffect(() => {
    if (status === 'processing' || status === 'started') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // ── Form submission handler ──
  const handleStartGeneration = async (formDataParams) => {
    const {
      mode,
      file,
      subject,
      topic,
      numberOfQuestions,
      difficulty,
      bloomLevel,
      generationMode,
      questionsPerBatch,
      maxConcurrentRequests,
    } = formDataParams;

    setIsSubmitting(true);
    setStatus('started');
    setAcceptedQuestions([]);
    setMetrics(null);
    setErrorMessage(null);
    setElapsedSeconds(0);
    setActiveMode(generationMode);
    setTotalRequested(numberOfQuestions);
    setWsStatus(null);

    try {
      let response;

      if (mode === 'pdf') {
        // ── Direct PDF Upload ──
        const formData = new FormData();
        formData.append('file', file);
        formData.append('number_of_questions', numberOfQuestions);
        formData.append('difficulty', difficulty);
        formData.append('bloom_level', bloomLevel);
        formData.append('question_type', 'mcq');
        formData.append('generation_mode', generationMode);
        formData.append('questions_per_batch', questionsPerBatch);
        formData.append('max_concurrent_requests', maxConcurrentRequests);

        response = await fetch(`${API_BASE_URL}/api/v1/generate-mcqs`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // ── RAG Notes Generation (JSON body) ──
        const payload = {
          subject,
          topic: topic || null,
          number_of_questions: numberOfQuestions,
          difficulty,
          bloom_level: bloomLevel,
          question_type: 'mcq',
          generation_mode: generationMode,
          questions_per_batch: questionsPerBatch,
          max_concurrent_requests: maxConcurrentRequests,
        };

        response = await fetch(`${API_BASE_URL}/api/v1/generate-mcqs-from-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Failed to initiate job' }));
        throw new Error(errData.detail || 'Failed to submit generation request.');
      }

      const data = await response.json();
      setJobId(data.job_id);
      setStatus('processing');
      setIsSubmitting(false);

      // Connect to WebSocket (same path for both modes)
      connectWebSocket(data.job_id);

    } catch (err) {
      setIsSubmitting(false);
      setStatus('error');
      setErrorMessage(err.message || 'Error starting generation job.');
    }
  };

  // ── WebSocket connection ──
  const connectWebSocket = (currentJobId) => {
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(`${WS_BASE_URL}/api/v1/ws/generate/${currentJobId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[WS] Connected to job: ${currentJobId}`);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.event) {
          case 'retrieval_started':
            setWsStatus('retrieval_started');
            break;

          case 'retrieval_completed':
            setWsStatus('retrieval_completed');
            break;

          case 'generation_started':
            setWsStatus('generation_started');
            setTotalRequested(msg.total_requested || totalRequested);
            if (msg.generation_mode) setActiveMode(msg.generation_mode);
            break;

          case 'question':
            if (msg.question) {
              setAcceptedQuestions((prev) => {
                const exists = prev.some((q) => q.question === msg.question.question);
                return exists ? prev : [...prev, msg.question];
              });
            }
            break;

          case 'completed':
            setStatus('completed');
            setWsStatus(null);
            if (msg.metrics) setMetrics(msg.metrics);
            fetchJobMetrics(currentJobId);
            ws.close();
            break;

          case 'partial':
            setStatus('partial');
            setWsStatus(null);
            if (msg.metrics) setMetrics(msg.metrics);
            fetchJobMetrics(currentJobId);
            ws.close();
            break;

          case 'error':
            setStatus('error');
            setWsStatus(null);
            setErrorMessage(msg.message || 'An error occurred during generation.');
            ws.close();
            break;

          default:
            break;
        }
      } catch (e) {
        console.error('[WS] Error parsing message:', e);
      }
    };

    ws.onerror = (err) => console.error('[WS] Error:', err);
    ws.onclose = () => console.log('[WS] Connection closed.');
  };

  // ── Fetch final metrics from REST ──
  const fetchJobMetrics = async (currentJobId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/job/${currentJobId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (e) {
      console.error('Failed to fetch job metrics:', e);
    }
  };

  // ── Reset ──
  const handleReset = () => {
    if (wsRef.current) wsRef.current.close();
    setJobId(null);
    setStatus('idle');
    setAcceptedQuestions([]);
    setMetrics(null);
    setErrorMessage(null);
    setElapsedSeconds(0);
    setWsStatus(null);
  };

  const isGenerating = status !== 'idle';

  return (
    <div style={{ backgroundColor: '#F8F4EC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header isHealthy={isHealthy} activeMode={activeMode} />

      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem', flex: 1 }}>

        {/* ── Tab Navigation (only shown when not generating) ── */}
        {!isGenerating && (
          <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '2px solid #0B192C' }}>
            {[
              { key: 'generate', label: 'Generate MCQs', icon: <Zap size={15} /> },
              { key: 'index', label: 'Index Study Notes', icon: <Database size={15} /> },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                style={{
                  padding: '0.65rem 1.25rem',
                  backgroundColor: activeTab === key ? '#0B192C' : 'transparent',
                  color: activeTab === key ? '#FFFDF9' : '#0B192C',
                  border: 'none',
                  borderBottom: activeTab === key ? '2px solid #990000' : '2px solid transparent',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  letterSpacing: '0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '-2px',
                  fontFamily: 'inherit',
                }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Index Notes Tab ── */}
        {!isGenerating && activeTab === 'index' && (
          <NotesUploadForm apiBase={API_BASE_URL} />
        )}

        {/* ── Generate MCQs Tab (form, idle) ── */}
        {!isGenerating && activeTab === 'generate' && (
          <GenerationForm onSubmit={handleStartGeneration} isSubmitting={isSubmitting} />
        )}

        {/* ── Live Generation View ── */}
        {isGenerating && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button
                onClick={handleReset}
                style={{
                  backgroundColor: '#0B192C',
                  color: '#FFFDF9',
                  border: '1px solid #0B192C',
                  padding: '0.4rem 0.85rem',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontFamily: 'inherit',
                }}
              >
                <RefreshCw size={14} />
                Configure New Job
              </button>

              {/* WebSocket phase indicator (RAG retrieval phases) */}
              {wsStatus && wsStatus !== 'generation_started' && (
                <div style={{
                  padding: '0.35rem 0.75rem',
                  backgroundColor: '#13243A',
                  color: '#DFD5C4',
                  border: '1px solid #DFD5C4',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}>
                  <Database size={13} />
                  {wsStatus === 'retrieval_started' && 'Retrieving evidence from vector store...'}
                  {wsStatus === 'retrieval_completed' && 'Evidence retrieved — starting generation'}
                </div>
              )}
            </div>

            <ProgressBar
              status={status}
              acceptedCount={acceptedQuestions.length}
              totalRequested={totalRequested}
              elapsedSeconds={elapsedSeconds}
              errorMessage={errorMessage}
            />
          </div>
        )}

        {/* ── Metrics Panel ── */}
        {metrics && <MetricsPanel metrics={metrics} />}

        {/* ── Question Cards ── */}
        {acceptedQuestions.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#0B192C',
              fontFamily: 'Georgia, serif',
              marginBottom: '1rem',
              borderBottom: '2px solid #990000',
              paddingBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>Validated Questions ({acceptedQuestions.length})</span>
              {(status === 'processing' || status === 'started') && (
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#990000' }}>
                  Real-Time Stream Active
                </span>
              )}
              {(status === 'completed' || status === 'partial') && (
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0B192C' }}>
                  {status === 'completed' ? 'Generation Complete' : 'Partial — Retry Budget Exhausted'}
                </span>
              )}
            </h2>

            <div>
              {acceptedQuestions.map((q, idx) => (
                <QuestionCard key={idx} question={q} index={idx} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        backgroundColor: '#0B192C',
        color: '#DFD5C4',
        textAlign: 'center',
        padding: '1rem',
        fontSize: '0.82rem',
        borderTop: '3px solid #990000',
        marginTop: '2rem',
      }}>
        High-Throughput AI MCQ Generation System &copy; 2026 — FastAPI + Qdrant RAG + React
      </footer>
    </div>
  );
}
