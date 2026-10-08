import asyncio
import logging
from typing import Dict, List, Optional, Any
from app.models.request_models import GenerationMetrics

logger = logging.getLogger(__name__)

class MCQJob:
    def __init__(self, job_id: str, requested_questions: int, concurrency: int, batch_size: int, generation_mode: str):
        self.job_id = job_id
        self.requested_questions = requested_questions
        self.status = "started"  # started, processing, completed, error
        self.error_message: Optional[str] = None
        self.accepted_questions: List[Dict[str, Any]] = []
        self.event_history: List[Dict[str, Any]] = []
        self.listeners: List[asyncio.Queue] = []
        
        self.metrics = GenerationMetrics(
            job_id=job_id,
            requested_questions=requested_questions,
            concurrency=concurrency,
            batch_size=batch_size,
            generation_mode=generation_mode
        )

    def publish_event(self, event: Dict[str, Any]):
        """Saves event to history and broadcasts to all current WebSocket queues."""
        self.event_history.append(event)
        for queue in self.listeners:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                logger.warning(f"Subscriber queue full for job {self.job_id}")

    def add_listener(self) -> asyncio.Queue:
        """Adds a new listener queue and pre-populates it with historical events."""
        queue: asyncio.Queue = asyncio.Queue()
        for past_event in self.event_history:
            queue.put_nowait(past_event)
        self.listeners.append(queue)
        return queue

    def remove_listener(self, queue: asyncio.Queue):
        if queue in self.listeners:
            self.listeners.remove(queue)


class JobManager:
    """In-memory manager for active generation jobs."""
    def __init__(self):
        self._jobs: Dict[str, MCQJob] = {}
        self._lock = asyncio.Lock()

    async def create_job(
        self,
        job_id: str,
        requested_questions: int,
        concurrency: int,
        batch_size: int,
        generation_mode: str
    ) -> MCQJob:
        async with self._lock:
            job = MCQJob(
                job_id=job_id,
                requested_questions=requested_questions,
                concurrency=concurrency,
                batch_size=batch_size,
                generation_mode=generation_mode
            )
            self._jobs[job_id] = job
            return job

    async def get_job(self, job_id: str) -> Optional[MCQJob]:
        async with self._lock:
            return self._jobs.get(job_id)

    async def remove_job(self, job_id: str):
        async with self._lock:
            if job_id in self._jobs:
                del self._jobs[job_id]


job_manager = JobManager()
