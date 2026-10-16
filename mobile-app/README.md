# AI MCQ Generator — Mobile App (React Native)

A lightweight, modular React Native mobile application built with **pure JavaScript** to interact with the High-Throughput AI MCQ Generator FastAPI backend.

---

## 🎨 Design & Aesthetics
- **Theme**: *Obsidian & Forest Emerald*
- **Strict Color Rules**: Built with **zero shades of blue, violet, pink, purple, or red**.
- **Accents**:
  - Primary: Emerald Green (`#059669`, `#10B981`)
  - Dark Surfaces: Neutral Charcoal / Obsidian (`#121413`, `#1A1E1B`)
  - Secondary: Warm Amber & Gold (`#D97706`, `#F59E0B`)
  - Warning/Error: Burnished Ochre / Rust Amber (`#C2410C` — non-red)
  - Cards: Crisp Off-White & Sage (`#FAFCFA`, `#EDF2EE`)

---

## 📱 Features

1. **Backend Health Monitoring**:
   - Live health indicator (Online / Offline status) pinging `/api/v1/health`.
   - Tap anytime to re-check connectivity.

2. **MCQ Generation & Dedicated Mobile API**:
   - **Progressive Mobile Batching**: Backend endpoints (`/api/v1/mobile/generate-mcqs` & `/api/v1/mobile/generate-mcqs-from-notes`) produce MCQs in expanding batch sizes (**1, 3, 5, 7, 9, max 10**), delivering the 1st question almost instantly to the device with zero wait time.
   - **Upload PDF Mode**: Direct document picking from device storage (`expo-document-picker`) and upload as multipart form data.
   - **From Study Notes (RAG Mode)**: Select subject (Maths, Physics, Chemistry, Biology) and optional topic to query vector embeddings stored in Qdrant.

3. **1-Per-Screen Interactive Question View**:
   - Displays 1 MCQ per screen with **Previous** and **Next** action buttons.
   - Live progress indicator with question counter (e.g. *Question 3 of 10*) and completion percentage bar.
   - Horizontal jump pills to immediately switch to any validated question.
   - Interactive option cards with touch selection and emerald checkmark for correct answers.
   - Expandable solution and explanation drawer.

4. **2D Chemical Molecular Structures (SMILES)**:
   - High-fidelity 2D molecular visual canvas powered by PubChem & NIH CACTUS chemical structure APIs.
   - Canonical SMILES formula inspect button.

5. **Study Notes Indexing (Vector Store)**:
   - PDF upload tab to extract, chunk, embed, and index into the Qdrant vector database.
   - Displays chunks created and vector count upon completion.

6. **Throughput Metrics Panel**:
   - Total generation time, time to first question, candidate acceptance rate, rejections, and batch latencies.

7. **Configurable `.env` API Base URL & In-App Switcher**:
   - Configured via `.env` with `EXPO_PUBLIC_API_BASE_URL`.
   - Built-in Settings modal in the app with connection testing and instant URL switching (ideal when switching between Android Emulator, iOS Simulator, or Physical device).

---

## 🛠️ How the App is Built (Architecture)

```
mobile-app/
├── .env                       # API Base URL configuration
├── .env.example               # Example config with IP addresses
├── App.js                     # Root entry point & WebSocket coordinator
├── package.json               # Dependencies (JavaScript only)
└── src/
    ├── config/
    │   └── api.js             # Routes URL from .env with fallback and health checks
    ├── theme/
    │   └── colors.js          # Strictly curated Emerald/Amber/Obsidian color tokens
    ├── services/
    │   └── mcqService.js      # Fetch API calls (PDF upload, Notes generation, Indexing)
    └── components/
        ├── Header.js          # Brand header with health dot & settings trigger
        ├── TabBar.js          # Tab navigation (Generate vs Index)
        ├── GenerationForm.js  # MCQ configuration form with document picker
        ├── NotesUploadForm.js # RAG notes indexing form
        ├── ProgressBar.js     # Live streaming progress bar and elapsed timer
        ├── QuestionCard.js    # Interactive MCQ card with options & explanation
        ├── VisualPreview.js   # Graph, SMILES, and Diagram previewer
        ├── MetricsPanel.js    # Performance and latency KPI cards
        └── SettingsModal.js   # In-app API URL switcher & ping test
```

---

## 🚀 Running the App

### 1. Install Dependencies
```bash
cd mobile-app
npm install
```

### 2. Configure `.env`
Open `mobile-app/.env`:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

> **Important Note for Mobile Devices & Emulators:**
> - **Web / iOS Simulator**: `http://localhost:8000` works directly.
> - **Android Emulator**: Use `http://10.0.2.2:8000` (10.0.2.2 maps to your host PC's localhost).
> - **Physical Phone (Expo Go)**: Use your computer's local Wi-Fi IP address (e.g. `http://192.168.1.15:8000`). Make sure your phone and PC are on the same Wi-Fi network.

### 3. Start the Development Server
```bash
npm start
```

- Press `w` to open in your web browser.
- Press `a` to open in an Android Emulator.
- Scan the QR code with the **Expo Go** app on your iPhone or Android device!
