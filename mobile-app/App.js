import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import colors from './src/theme/colors';
import { checkHealth, getWsBaseUrl } from './src/config/api';
import {
  generateMcqsFromPdf,
  generateMcqsFromNotes,
  fetchJobDetails,
} from './src/services/mcqService';

// Components
import Header from './src/components/Header';
import TabBar from './src/components/TabBar';
import GenerationForm from './src/components/GenerationForm';
import NotesUploadForm from './src/components/NotesUploadForm';
import ProgressBar from './src/components/ProgressBar';
import QuestionCard from './src/components/QuestionCard';
import MetricsPanel from './src/components/MetricsPanel';
import SettingsModal from './src/components/SettingsModal';

export default function App() {
  // Navigation & Tab state
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'index'
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Backend Health
  const [isHealthy, setIsHealthy] = useState(false);

  // Generation Job State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | started | processing | completed | partial | error
  const [totalRequested, setTotalRequested] = useState(0);
  const [acceptedQuestions, setAcceptedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeMode, setActiveMode] = useState('parallel');
  const [wsStatus, setWsStatus] = useState(null);

  const wsRef = useRef(null);
  const timerRef = useRef(null);

  // Health check on app start
  const runHealthCheck = async () => {
    const result = await checkHealth();
    setIsHealthy(result.ok);
  };

  useEffect(() => {
    let isMounted = true;
    checkHealth().then((res) => {
      if (isMounted) setIsHealthy(res.ok);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Elapsed timer tracking
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

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Handle generation start from form
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
    setCurrentQuestionIndex(0);
    setMetrics(null);
    setErrorMessage(null);
    setElapsedSeconds(0);
    setActiveMode(generationMode);
    setTotalRequested(numberOfQuestions);
    setWsStatus(null);

    try {
      let data;
      if (mode === 'pdf') {
        data = await generateMcqsFromPdf({
          file,
          numberOfQuestions,
          difficulty,
          bloomLevel,
          generationMode,
          questionsPerBatch,
          maxConcurrentRequests,
        });
      } else {
        data = await generateMcqsFromNotes({
          subject,
          topic,
          numberOfQuestions,
          difficulty,
          bloomLevel,
          generationMode,
          questionsPerBatch,
          maxConcurrentRequests,
        });
      }

      setJobId(data.job_id);
      setStatus('processing');
      setIsSubmitting(false);

      // Connect to WebSocket stream
      connectWebSocket(data.job_id);
    } catch (err) {
      setIsSubmitting(false);
      setStatus('error');
      setErrorMessage(err.message || 'Error initiating generation job.');
    }
  };

  // Connect to backend WebSocket stream
  const connectWebSocket = (currentJobId) => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
    }

    const wsUrl = `${getWsBaseUrl()}/api/v1/ws/generate/${currentJobId}`;
    console.log(`[Mobile WS] Connecting to: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`[Mobile WS] Connected to job: ${currentJobId}`);
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
            if (msg.total_requested) setTotalRequested(msg.total_requested);
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
            fetchFinalMetrics(currentJobId);
            ws.close();
            break;

          case 'partial':
            setStatus('partial');
            setWsStatus(null);
            if (msg.metrics) setMetrics(msg.metrics);
            fetchFinalMetrics(currentJobId);
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
      } catch (err) {
        console.error('[Mobile WS] Error parsing message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[Mobile WS] Error:', err);
    };

    ws.onclose = () => {
      console.log('[Mobile WS] Connection closed.');
    };
  };

  // Fetch final metrics from REST endpoint
  const fetchFinalMetrics = async (currentJobId) => {
    try {
      const data = await fetchJobDetails(currentJobId);
      if (data && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.warn('Failed to fetch job details:', e);
    }
  };

  // Reset to form
  const handleReset = () => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
    }
    setJobId(null);
    setStatus('idle');
    setAcceptedQuestions([]);
    setCurrentQuestionIndex(0);
    setMetrics(null);
    setErrorMessage(null);
    setElapsedSeconds(0);
    setWsStatus(null);
  };

  const isGenerating = status !== 'idle';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.surfaceDark}
      />

      {/* Header */}
      <Header
        isHealthy={isHealthy}
        onCheckHealth={runHealthCheck}
        activeMode={activeMode}
        onOpenSettings={() => setSettingsVisible(true)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Bar (only when idle) */}
        {!isGenerating && (
          <TabBar activeTab={activeTab} onSelectTab={setActiveTab} />
        )}

        {/* Generate MCQs Form */}
        {!isGenerating && activeTab === 'generate' && (
          <GenerationForm
            onSubmit={handleStartGeneration}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Index Notes Form */}
        {!isGenerating && activeTab === 'index' && <NotesUploadForm />}

        {/* Live Generation Progress View */}
        {isGenerating && (
          <View>
            <ProgressBar
              status={status}
              wsStatus={wsStatus}
              acceptedCount={acceptedQuestions.length}
              totalRequested={totalRequested}
              elapsedSeconds={elapsedSeconds}
              errorMessage={errorMessage}
              jobId={jobId}
              onReset={handleReset}
            />

            {/* 1-Per-Screen Interactive Question View */}
            {acceptedQuestions.length > 0 && (
              <QuestionCard
                question={acceptedQuestions[currentQuestionIndex] || acceptedQuestions[0]}
                currentIndex={currentQuestionIndex}
                totalQuestions={acceptedQuestions.length}
                onPrevious={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                onNext={() => setCurrentQuestionIndex((prev) => Math.min(acceptedQuestions.length - 1, prev + 1))}
                onSelectIndex={(idx) => setCurrentQuestionIndex(idx)}
              />
            )}

            {/* Performance Metrics Panel (shown after generation finishes or is partial) */}
            {metrics && (status === 'completed' || status === 'partial') && (
              <MetricsPanel metrics={metrics} />
            )}
          </View>
        )}
      </ScrollView>

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onHealthChange={(healthy) => setIsHealthy(healthy)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  questionsSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
