# High-Throughput AI MCQ Generation System Backend

A high-performance, asynchronous FastAPI backend designed to demonstrate how **parallel LLM generation** significantly reduces latency when producing large batches of Multiple Choice Questions (MCQs) from an uploaded PDF study document.

> **Note**: This is a backend-only project. It intentionally **does NOT use RAG**, vector databases (Chroma/Pinecone), PostgreSQL, or persistent question banks. The uploaded document serves as the sole source of truth for generation.

---

## 🚀 Key Features & Architectural Highlights

1. **Parallel vs. Sequential Benchmarking**:
   - **Parallel Mode**: Generates multiple question batches concurrently using `asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)`.
   - **Sequential Mode**: Generates batches one after another for direct latency comparison.
   
2. **Real-time WebSocket Streaming**:
   - As soon as a question is validated by the pipeline, it is pushed to the client via WebSockets (`WS /api/v1/ws/generate/{job_id}`).
   - Disconnect-resilient: Generation continues independently in background tasks; late subscribers receive missed events upon connection.

3. **Multi-Layer Validation Pipeline**:
   - **Layer 1 (Schema Validation)**: Pydantic parsing of options length, 0-3 index, and fields.
   - **Layer 2 (Deterministic Quality Checks)**: Unique distractors, non-empty options, question length bounds.
   - **Layer 3 (Semantic Deduplication)**: TF-IDF + Cosine Similarity comparison against previously accepted questions (configurable `DUPLICATE_SIMILARITY_THRESHOLD`).
   - **Layer 4 (Optional LLM Quality Validator)**: Evaluates factual grounding and distractor quality (configurable via `ENABLE_LLM_VALIDATION`).

4. **Guaranteed Question Count (Dynamic Over-Generation)**:
   - If requested = 100 questions, and 8 fail validation, the orchestrator automatically triggers dynamic replacement batches until **exactly 100 valid questions** are accepted or `MAX_RETRIES` is hit.

5. **Primary & Fallback Gemini LLM Support**:
   - Primary model: `gemini-1.5-flash`
   - Fallback model: `gemini-2.5-flash`

---

## 🛠️ Project Structure

```
mcq-generator/
│
├── app/
│   ├── main.py                     # FastAPI app entry point & CORS
│   ├── config.py                   # Pydantic Settings & environment variables
│   │
│   ├── api/
│   │   ├── routes_generation.py    # POST /api/v1/generate-mcqs & GET /api/v1/job/{job_id}
│   │   └── routes_websocket.py     # WS /api/v1/ws/generate/{job_id}
│   │
│   ├── services/
│   │   ├── document_service.py     # PyMuPDF text extraction & context capping
│   │   ├── llm_service.py          # Google GenAI SDK async call & fallback
│   │   ├── generation_service.py   # Async parallel & sequential orchestrator
│   │   ├── validation_service.py   # 4-Layer validation pipeline
│   │   ├── duplicate_service.py    # TF-IDF & Cosine Similarity deduplication
│   │   └── job_service.py          # In-memory job manager & listener queues
│   │
│   ├── models/
│   │   ├── request_models.py       # API parameters & metrics schema
│   │   └── question_models.py      # MCQ structured output schema
│   │
│   ├── prompts/
│   │   └── mcq_generation_prompt.py# Strict document-grounding system prompt
│   │
│   └── websocket/
│       └── manager.py              # WebSocket connection & streaming manager
│
├── tests/
│   ├── test_api.py                 # API & WebSocket integration tests
│   ├── test_document_service.py   # PDF text extraction tests
│   └── test_validation.py         # Validation & deduplication tests
│
├── .env                            # Environment variables (git-ignored)
├── .env.example                    # Template environment variables
├── .gitignore                      # Git ignore rules
├── requirements.txt                # Python dependencies
├── README.md                       # Comprehensive documentation
└── run.py                          # Uvicorn server launcher
```

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the root directory (refer to `.env.example`):

```env
# LLM Provider and Models
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_actual_gemini_api_key_here
MODEL_NAME=gemini-1.5-flash
FALLBACK_MODEL_NAME=gemini-2.5-flash

# Concurrency & Batching Defaults
MAX_CONCURRENT_REQUESTS=5
QUESTIONS_PER_BATCH=10
MAX_RETRIES=5
GENERATION_MODE=parallel

# Validation Settings
DUPLICATE_SIMILARITY_THRESHOLD=0.85
ENABLE_LLM_VALIDATION=false

# Document Context Settings
MAX_DOCUMENT_CHARS=100000

# Server Settings
HOST=0.0.0.0
PORT=8000
```

---

## 💻 Environment Setup & Local Execution (Windows)

### 1. Activate Virtual Environment
Use the existing virtual environment:
```powershell
# Activate on Windows PowerShell:
.\venv\Scripts\Activate.ps1
```

*(Or create a new environment if needed)*:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install Dependencies
```powershell
venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 3. Run Unit & Integration Tests
```powershell
venv\Scripts\python.exe -m pytest -v
```

### 4. Start Backend Server
```powershell
venv\Scripts\python.exe run.py
```
*Server will listen at `http://localhost:8000` (API Docs available at `http://localhost:8000/docs`).*

---

## 📡 API Endpoints & Usage

### 1. Health Check
```http
GET /api/v1/health
```
**Response:**
```json
{
  "status": "ok",
  "service": "high-throughput-mcq-generator"
}
```

### 2. Initiate MCQ Generation Job
```http
POST /api/v1/generate-mcqs
Content-Type: multipart/form-data
```
**Form Data:**
- `file`: PDF file upload (e.g. `notes.pdf`)
- `number_of_questions`: `100`
- `difficulty`: `medium`
- `bloom_level`: `apply`
- `question_type`: `mcq`
- `generation_mode` *(optional)*: `parallel` or `sequential`
- `questions_per_batch` *(optional)*: `10`
- `max_concurrent_requests` *(optional)*: `5`

**Example Response (Immediate `202 Accepted`):**
```json
{
  "job_id": "a1b2c3d4e5f6",
  "status": "started",
  "total_questions": 100,
  "message": "Job initialized. Connect to WebSocket /api/v1/ws/generate/a1b2c3d4e5f6 for realtime question streaming."
}
```

### 3. Realtime WebSocket Streaming
Connect client to:
```
WS ws://localhost:8000/api/v1/ws/generate/a1b2c3d4e5f6
```

**Streamed Event Flow:**

1. **Generation Started**:
```json
{
  "event": "generation_started",
  "job_id": "a1b2c3d4e5f6",
  "total_requested": 100,
  "generation_mode": "parallel",
  "concurrency": 5,
  "batch_size": 10
}
```

2. **Incremental Question Stream (Emitted as validated)**:
```json
{
  "event": "question",
  "job_id": "a1b2c3d4e5f6",
  "question_number": 1,
  "question": {
    "question": "What is the primary characteristic of superposition in quantum mechanics?",
    "options": [
      "A particle existing in multiple state combinations until measured",
      "Continuous classical momentum transfer",
      "Thermal equilibrium of subatomic particles",
      "Static charge accumulation in insulators"
    ],
    "correct_option": 0,
    "explanation": "Superposition allows quantum states to be combined until measurement collapses the wavefunction.",
    "difficulty": "medium",
    "bloom_level": "apply",
    "source_reference": "Page 1"
  }
}
```

3. **Job Completion Event (With Detailed Metrics)**:
```json
{
  "event": "completed",
  "job_id": "a1b2c3d4e5f6",
  "total_questions": 100,
  "metrics": {
    "job_id": "a1b2c3d4e5f6",
    "requested_questions": 100,
    "generated_candidates": 110,
    "accepted_questions": 100,
    "rejected_questions": 10,
    "retries": 1,
    "concurrency": 5,
    "batch_size": 10,
    "generation_mode": "parallel",
    "extraction_time_ms": 142.5,
    "prompt_prep_time_ms": 12.1,
    "total_time_ms": 6820.4,
    "time_to_first_question_ms": 1250.2,
    "time_to_25_questions_ms": 2840.1,
    "time_to_50_questions_ms": 4210.6,
    "time_to_100_questions_ms": 6820.4,
    "batch_latencies_ms": [1210.5, 1180.2, 1240.0, 1310.6, 1290.1]
  }
}
```

---

## 📊 Parallel vs. Sequential Latency Comparison

To benchmark latency difference:

1. **Parallel Request**: Pass `generation_mode=parallel` (or set `GENERATION_MODE=parallel` in `.env`).
2. **Sequential Request**: Pass `generation_mode=sequential` (or set `GENERATION_MODE=sequential` in `.env`).

**Observed Latency Characteristics**:
- **Sequential**: Time scales linearly (\( T \approx N_{\text{batches}} \times T_{\text{batch}} \)). Generating 100 questions in 10 sequential batches takes \(\sim 30-40\) seconds.
- **Parallel**: Time scales with concurrency (\( T \approx \frac{N_{\text{batches}}}{\text{concurrency}} \times T_{\text{batch}} \)). Generating 100 questions in 10 batches with `concurrency=5` takes \(\sim 6-8\) seconds.
