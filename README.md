# High-Throughput AI MCQ Generation System Backend with RAG & Persistent Qdrant Vector Store

A high-performance, asynchronous FastAPI backend designed to demonstrate how **parallel LLM generation** and **document-based Retrieval-Augmented Generation (RAG)** significantly reduce latency and provide grounded MCQ generation from stored study notes.

---

## 🚀 Key Features & System Capabilities

1. **Persistent Document Notes Indexing (`POST /api/v1/notes/upload`)**:
   - Upload study notes or textbooks (PDF format), extract text page-by-page, chunk semantically, embed, and store persistently in **Qdrant**.
   - Idempotency & Deduplication: Calculates document content hashes to avoid re-embedding identical uploads.
   - Metadata tagging: `subject` (`maths`, `chemistry`, `physics`, `biology`), optional `topic`, `document_id`, `document_title`, `page_number`, `chunk_index`.

2. **RAG-based MCQ Generation (`POST /api/v1/generate-mcqs-from-notes`)**:
   - Generates MCQs directly from indexed notes in Qdrant **without re-uploading documents**.
   - Applies strict metadata filters (`subject` & optional `topic`).
   - Retrieves top evidence chunks, constructs evidence packets, and allocates questions across evidence.

3. **Direct Document File-Upload MCQ Generation (`POST /api/v1/generate-mcqs`)**:
   - Preserved original single-document file-upload workflow for backward compatibility.

4. **Parallel vs. Sequential Batch Orchestration**:
   - **Parallel Mode**: Generates multiple question batches concurrently using `asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)`.
   - **Sequential Mode**: Generates batches sequentially for latency benchmarking.

5. **Real-time WebSocket Streaming (`WS /api/v1/ws/generate/{job_id}`)**:
   - Emits real-time events: `retrieval_started`, `retrieval_completed`, `generation_started`, `batch_started`, `batch_completed`, `question`, `progress`, `completed`, `partial`, `error`.
   - Disconnect-resilient: Generation continues independently in background tasks; late subscribers receive missed events upon connection.

6. **Multi-Layer Validation & Dynamic Over-generation**:
   - **Layer 1**: Pydantic schema validation (`MCQQuestion`).
   - **Layer 2**: Deterministic quality checks (4 distinct options, valid 0-3 index, reasonable length).
   - **Layer 3**: Semantic TF-IDF deduplication across all accepted questions.
   - **Layer 4**: Optional LLM quality validation.
   - Dynamic bounded retries if validation rejects candidates until target count is reached.

---

## 🛠️ Project Structure

```text
mcq-generator/
│
├── app/
│   ├── main.py                     # FastAPI app entry point & router mounting
│   ├── config.py                   # Pydantic Settings & environment variables
│   │
│   ├── api/
│   │   ├── routes_notes.py         # POST /api/v1/notes/upload & /api/v1/generate-mcqs-from-notes
│   │   ├── routes_generation.py    # POST /api/v1/generate-mcqs & GET /api/v1/job/{job_id}
│   │   └── routes_websocket.py     # WS /api/v1/ws/generate/{job_id}
│   │
│   ├── services/
│   │   ├── document_service.py     # PDF text extraction & context capping
│   │   ├── embedding_service.py    # FastEmbed / LangChain embeddings provider
│   │   ├── vector_store_service.py # Qdrant persistent storage, indexing & filtering
│   │   ├── rag_retrieval_service.py# RAG evidence retrieval & context preparation
│   │   ├── llm_service.py          # Google GenAI SDK async call & model fallback
│   │   ├── generation_service.py   # Parallel/Sequential orchestrator & RAG workflow
│   │   ├── validation_service.py   # 4-Layer validation pipeline
│   │   ├── duplicate_service.py    # TF-IDF & Cosine Similarity deduplication
│   │   └── job_service.py          # In-memory job manager & event broadcaster
│   │
│   ├── models/
│   │   ├── request_models.py       # API parameter schemas & metrics
│   │   └── question_models.py      # MCQ structured output schema
│   │
│   ├── prompts/
│   │   └── mcq_generation_prompt.py# Strict document-grounding system prompt
│   │
│   └── websocket/
│       └── manager.py              # WebSocket connection & streaming manager
│
├── tests/
│   ├── test_notes_rag.py           # RAG & notes upload API unit tests
│   ├── test_api.py                 # File upload & WebSocket integration tests
│   ├── test_document_service.py   # PDF text extraction tests
│   └── test_validation.py         # Validation & deduplication tests
│
├── .env                            # Environment variables (git-ignored)
├── .env.example                    # Template environment variables
├── requirements.txt                # Python dependencies
├── README.md                       # Complete backend documentation
└── run.py                          # Uvicorn server launcher
```

---

## ⚙️ Environment Variables (`.env`)

Create or update `.env` in the project root directory:

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

# Vector Store & RAG Settings
VECTOR_STORE_PROVIDER=qdrant
QDRANT_URL=
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=study_notes
QDRANT_PATH=./qdrant_storage

EMBEDDING_PROVIDER=fastembed
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
EMBEDDING_BATCH_SIZE=64

CHUNK_SIZE=1000
CHUNK_OVERLAP=150

RETRIEVAL_TOP_K=15
MAX_RETRIEVAL_CONTEXT_CHARS=30000

# Server Settings
HOST=0.0.0.0
PORT=8000
```

---

## 💻 Qdrant Vector Store Setup

1. **Local Persistent Storage Mode (Default)**:
   - If `QDRANT_URL` is left empty, the system automatically runs Qdrant in local disk-persistence mode storing vectors at `./qdrant_storage`.
   - Vectors and metadata persist across application restarts.

2. **Qdrant Cloud / Remote Server Mode**:
   - Set `QDRANT_URL=https://your-cluster.qdrant.tech` and `QDRANT_API_KEY=your_qdrant_api_key` in `.env`.

---

## 📡 API Endpoints & cURL Examples

### 1. Upload Study Notes (`POST /api/v1/notes/upload`)
```bash
curl -X POST "http://localhost:8000/api/v1/notes/upload" \
  -F "file=@physics_notes.pdf" \
  -F "subject=physics" \
  -F "topic=projectile_motion" \
  -F "document_title=Physics Chapter 1"
```
**Response (`201 Created`):**
```json
{
  "status": "indexed",
  "document_id": "doc_a1b2c3d4",
  "document_title": "Physics Chapter 1",
  "subject": "physics",
  "topic": "projectile_motion",
  "total_pages": 35,
  "total_chunks": 84,
  "message": "Document indexed successfully."
}
```

### 2. Generate MCQs from Indexed Notes (`POST /api/v1/generate-mcqs-from-notes`)
```bash
curl -X POST "http://localhost:8000/api/v1/generate-mcqs-from-notes" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "physics",
    "topic": "projectile_motion",
    "number_of_questions": 50,
    "difficulty": "medium",
    "bloom_level": "apply",
    "question_type": "mcq"
  }'
```
**Response (`202 Accepted`):**
```json
{
  "job_id": "job_987654321",
  "status": "started",
  "total_requested": 50,
  "websocket_path": "/api/v1/ws/generate/job_987654321"
}
```

### 3. Direct PDF Upload MCQ Generation (`POST /api/v1/generate-mcqs`)
```bash
curl -X POST "http://localhost:8000/api/v1/generate-mcqs" \
  -F "file=@notes.pdf" \
  -F "number_of_questions=20" \
  -F "difficulty=medium" \
  -F "bloom_level=apply"
```

---

## 📡 Realtime WebSocket Events (`WS /api/v1/ws/generate/{job_id}`)

Connect client to `ws://localhost:8000/api/v1/ws/generate/{job_id}`.

**Streamed Event Types**:

1. `retrieval_started`: Vector search initiated.
2. `retrieval_completed`: Chunks retrieved from Qdrant.
3. `generation_started`: Batch orchestrator started.
4. `batch_started`: Individual LLM generation batch started.
5. `question`: Emitted immediately when an MCQ passes all 4 validation layers.
6. `progress`: Periodic progress counter (`accepted_count` / `total_requested`).
7. `completed`: Final completion event containing latency metrics.
8. `partial`: Emitted if maximum retry budget is hit before fulfilling full requested count.
9. `error`: Emitted if a fatal error occurs.

---

## 🔧 Local Server Startup (Windows)

### 1. Activate Environment
```powershell
.\venv\Scripts\Activate.ps1
```

### 2. Start Backend Server
```powershell
venv\Scripts\python.exe run.py
```
*Server runs at `http://localhost:8000` (Swagger UI at `http://localhost:8000/docs`).*
