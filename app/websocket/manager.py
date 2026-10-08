import json
import logging
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from app.services.job_service import job_manager

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections and streams job generation events to clients."""
    
    async def connect_and_stream(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        logger.info(f"WebSocket client connected for job_id: {job_id}")

        job = await job_manager.get_job(job_id)
        if not job:
            error_event = {
                "event": "error",
                "job_id": job_id,
                "message": f"Generation job '{job_id}' not found."
            }
            await websocket.send_json(error_event)
            await websocket.close()
            return

        # Subscribe to job events
        queue = job.add_listener()

        try:
            while True:
                # Wait for next event from job event queue
                event = await queue.get()
                await websocket.send_json(event)
                queue.task_done()

                # Stop streaming if job completed or errored out
                if event.get("event") in ("completed", "error"):
                    logger.info(f"Job {job_id} reached terminal state '{event.get('event')}'. Closing WebSocket.")
                    break
        except WebSocketDisconnect:
            logger.info(f"WebSocket client disconnected for job_id: {job_id}")
        except Exception as e:
            logger.warning(f"Error streaming WebSocket for job_id {job_id}: {e}")
        finally:
            job.remove_listener(queue)

websocket_manager = ConnectionManager()
