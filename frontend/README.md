# MCQ Generator Frontend

Interactive React + Vite frontend for high-throughput AI MCQ generation with real-time WebSocket question streaming, live metrics, and rich multi-modal visual rendering.

## 🎨 Visual Rendering Modules

- **Interactive Graphs (`PlotlyRenderer`)**: Renders interactive Plotly JSON graph specifications for mathematics and physics questions.
- **Chemical Structures (`SmilesRenderer`)**: Renders SMILES molecular structures using SmilesDrawer into clean, centered, scalable vector SVGs.
- **Biological Diagrams (`DiagramRenderer`)**: Renders biological diagrams from the backend local image pool or SerpAPI fallbacks, with graceful empty-state handling.
- **LaTeX Math (`LatexRenderer`)**: Renders inline `$...$` and block `$$...$$` mathematical notations via KaTeX.

## 🛠️ Environment Configuration

Create or update `.env` in the `frontend/` folder:

```env
# Backend API Base URL (adjust for production deployment, e.g. https://your-backend.onrender.com)
VITE_API_BASE_URL=http://localhost:8000

# Optional: WebSocket Base URL (automatically inferred as ws:// or wss:// from VITE_API_BASE_URL if omitted)
# VITE_WS_BASE_URL=ws://localhost:8000
```

## ⏱️ Health Keep-Alive

The application performs an initial health check on load, followed by a periodic keep-alive ping every **14 minutes** to prevent free-tier cloud instances (e.g., Render, Koyeb) from idling.

## 🚀 Development & Build

```bash
# Install dependencies
npm install

# Start local Vite dev server (http://localhost:5173)
npm run dev

# Build production bundle
npm run build
```
