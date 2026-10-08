import logging
from fastapi import APIRouter, WebSocket
from app.websocket.manager import websocket_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket Realtime Streaming"])

@router.websocket("/api/v1/ws/generate/{job_id}")
@router.websocket("/ws/generate/{job_id}")
async def websocket_generate_endpoint(websocket: WebSocket, job_id: str):
    """
    WebSocket endpoint streaming generated valid questions and status events in real-time.
    Supports reconnection and late subscriber catch-up.
    """
    await websocket_manager.connect_and_stream(websocket, job_id)
