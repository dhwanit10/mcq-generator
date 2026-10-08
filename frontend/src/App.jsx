import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import GenerationForm from './components/GenerationForm';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import MetricsPanel from './components/MetricsPanel';
import { Sparkles, BarChart2, CheckCircle, RefreshCw } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';
const WS_BASE_URL = 'ws://localhost:8000';

export default function App() {
  const [isHealthy, setIsHealthy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, started, processing, completed, error
  const [totalRequested, setTotalRequested] = useState(0);
  const [acceptedQuestions, setAcceptedQuestions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeMode, setActiveMode] = useState('parallel');

  const wsRef = useRef(null);
  const timerRef = useRef(null);

  // Check Backend Health on mount
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
    } catch (e) {
      setIsHealthy(false);
    }
  };

  // Timer counter effect
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

  // Handle Form Submission
  const handleStartGeneration = async (formDataParams) => {
    const {
      file,
      numberOfQuestions,
      difficulty,
      bloomLevel,
      generationMode,
      questionsPerBatch,
      maxConcurrentRequests
    } = formDataParams;

    setIsSubmitting(true);
    setStatus('started');
    setAcceptedQuestions([]);
    setMetrics(null);
    setErrorMessage(null);
    setElapsedSeconds(0);
    setActiveMode(generationMode);
    setTotalRequested(numberOfQuestions);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('number_of_questions', numberOfQuestions);
    formData.append('difficulty', difficulty);
    formData.append('bloom_level', bloomLevel);
    formData.append('question_type', 'mcq');
    formData.append('generation_mode', generationMode);
    formData.append('questions_per_batch', questionsPerBatch);
    formData.append('max_concurrent_requests', maxConcurrentRequests);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/generate-mcqs`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Failed to initiate job' }));
        throw new Error(errData.detail || 'Failed to submit generation request.');
      }

      const data = await response.json();
      setJobId(data.job_id);
      setStatus('processing');
      setIsSubmitting(false);

      // Connect to WebSocket endpoint
      connectWebSocket(data.job_id);

    } catch (err) {
      setIsSubmitting(false);
      setStatus('error');
      setErrorMessage(err.message || 'Error starting generation job.');
    }
  };

  // Connect to WebSocket for real-time streamed questions
  const connectWebSocket = (currentJobId) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `${WS_BASE_URL}/api/v1/ws/generate/${currentJobId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to WebSocket stream for job: ${currentJobId}`);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.event === 'generation_started') {
          setTotalRequested(msg.total_requested || totalRequested);
          if (msg.generation_mode) setActiveMode(msg.generation_mode);
        } else if (msg.event === 'question') {
          if (msg.question) {
            setAcceptedQuestions((prev) => {
              // Avoid duplicate question insertions
              const exists = prev.some((q) => q.question === msg.question.question);
              return exists ? prev : [...prev, msg.question];
            });
          }
        } else if (msg.event === 'completed') {
          setStatus('completed');
          if (msg.metrics) setMetrics(msg.metrics);
          fetchJobMetrics(currentJobId);
          ws.close();
        } else if (msg.event === 'error') {
          setStatus('error');
          setErrorMessage(msg.message || 'An error occurred during LLM question generation.');
          ws.close();
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed.');
    };
  };

  // Fetch final job status and metrics from REST endpoint
  const fetchJobMetrics = async (currentJobId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/job/${currentJobId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (e) {
      console.error('Failed to fetch job stats:', e);
    }
  };

  // Reset to initial form state
  const handleReset = () => {
    if (wsRef.current) wsRef.current.close();
    setJobId(null);
    setStatus('idle');
    setAcceptedQuestions([]);
    setMetrics(null);
    setErrorMessage(null);
    setElapsedSeconds(0);
  };

  return (
    <div style={{ backgroundColor: '#F8F4EC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header isHealthy={isHealthy} activeMode={activeMode} />

      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem', flex: 1 }}>
        
        {/* Generation Form */}
        {status === 'idle' && (
          <GenerationForm onSubmit={handleStartGeneration} isSubmitting={isSubmitting} />
        )}

        {/* Live Generation Progress Bar */}
        {status !== 'idle' && (
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
                  gap: '0.4rem'
                }}
              >
                <RefreshCw size={14} />
                Configure New Job
              </button>
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

        {/* Final Job Metrics Panel */}
        {metrics && <MetricsPanel metrics={metrics} />}

        {/* Questions Cards Stream */}
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
              justifyContent: 'space-between'
            }}>
              <span>Validated Generated Questions ({acceptedQuestions.length})</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#990000' }}>
                Real-Time Stream Active
              </span>
            </h2>

            <div>
              {acceptedQuestions.map((q, idx) => (
                <QuestionCard key={idx} question={q} index={idx} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#0B192C',
        color: '#DFD5C4',
        textAlign: 'center',
        padding: '1rem',
        fontSize: '0.82rem',
        borderTop: '3px solid #990000',
        marginTop: '2rem'
      }}>
        High-Throughput AI MCQ Generation System &copy; 2026 — Pure FastAPI Backend & React Frontend
      </footer>
    </div>
  );
}
