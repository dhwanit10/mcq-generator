import { getApiBaseUrl } from '../config/api';

/**
 * Service handling all HTTP requests to the FastAPI MCQ Generator backend.
 */

export async function generateMcqsFromPdf(params) {
  const {
    file,
    numberOfQuestions,
    difficulty,
    bloomLevel,
    generationMode,
    questionsPerBatch,
    maxConcurrentRequests,
  } = params;

  const baseUrl = getApiBaseUrl();
  const formData = new FormData();

  // In React Native, files for multipart/form-data use an object with { uri, name, type }
  if (file) {
    formData.append('file', {
      uri: file.uri,
      name: file.name || 'document.pdf',
      type: file.mimeType || 'application/pdf',
    });
  }

  formData.append('number_of_questions', String(numberOfQuestions));
  formData.append('difficulty', difficulty);
  formData.append('bloom_level', bloomLevel);
  formData.append('question_type', 'mcq');
  formData.append('generation_mode', generationMode);
  formData.append('questions_per_batch', String(questionsPerBatch));
  formData.append('max_concurrent_requests', String(maxConcurrentRequests));

  const response = await fetch(`${baseUrl}/api/v1/mobile/generate-mcqs`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to initiate PDF job' }));
    throw new Error(errorData.detail || `Server returned ${response.status}`);
  }

  return await response.json(); // returns { job_id, status, ... }
}

export async function generateMcqsFromNotes(params) {
  const {
    subject,
    topic,
    numberOfQuestions,
    difficulty,
    bloomLevel,
    generationMode,
    questionsPerBatch,
    maxConcurrentRequests,
  } = params;

  const baseUrl = getApiBaseUrl();
  const payload = {
    subject,
    topic: topic ? topic.trim() : null,
    number_of_questions: Number(numberOfQuestions),
    difficulty,
    bloom_level: bloomLevel,
    question_type: 'mcq',
    generation_mode: generationMode,
    questions_per_batch: Number(questionsPerBatch),
    max_concurrent_requests: Number(maxConcurrentRequests),
  };

  const response = await fetch(`${baseUrl}/api/v1/mobile/generate-mcqs-from-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to initiate Notes job' }));
    throw new Error(errorData.detail || `Server returned ${response.status}`);
  }

  return await response.json(); // returns { job_id, status, ... }
}

export async function uploadStudyNotes(params) {
  const { file, subject, topic, documentTitle } = params;
  const baseUrl = getApiBaseUrl();

  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name || 'study_notes.pdf',
    type: file.mimeType || 'application/pdf',
  });
  formData.append('subject', subject);
  if (topic && topic.trim()) {
    formData.append('topic', topic.trim().toLowerCase());
  }
  if (documentTitle && documentTitle.trim()) {
    formData.append('document_title', documentTitle.trim());
  }

  const response = await fetch(`${baseUrl}/api/v1/notes/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to index study notes.');
  }

  return data;
}

export async function fetchJobDetails(jobId) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/v1/job/${jobId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch job details (${response.status})`);
  }
  return await response.json();
}
