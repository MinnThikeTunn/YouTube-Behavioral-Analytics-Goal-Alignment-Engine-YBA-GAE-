# YouTube Behavioral Analytics & Goal Alignment Engine (YBA-GAE)

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-SentenceTransformers-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://www.sbert.net/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**YouTube Behavioral Analytics & Goal Alignment Engine (YBA-GAE)** is a privacy-first, full-stack analytics platform that converts live YouTube viewing streams from the browser extension into actionable behavioral metrics, real-time focus interventions, and semantic goal alignment insights.

By combining live DOM telemetry with unsupervised **PyTorch & ONNX `sentence-transformers` (`all-MiniLM-L6-v2`) vector embeddings**, YBA-GAE evaluates user focus ratios, session switching velocity, circadian watching habits, and goal alignment in real time without manual file imports.

---

## ✨ Key Features

* **⚡ Real-Time Extension Telemetry & Live Sync:** Ingests live YouTube video events, channel names, and dwell times via Chrome Extension (Manifest V3) with sub-12ms ONNX INT8 quantized vector scoring and WebSocket updates.
* **🧠 Unsupervised Semantic Goal Alignment:** Uses 384-dimensional vector embeddings on local CPU to calculate cosine similarity between video metadata and personal target goals (e.g., *Software Engineering*, *Machine Learning*, *Productivity*).
* **📊 Mathematical Behavioral Metrics Engine:**
  * **Focus Ratio ($FR$):** Percentage of video events matching your target learning domain.
  * **Completion Probability ($P_n$):** Watch duration proxy derived from inter-click timestamp gaps ($\min(1.0, (t_{n+1} - t_n) / D_n)$) with 30-minute session boundary resets.
  * **Session Density ($SD$):** Measures rapid channel switching and doomscrolling velocity (flagged if $>15$ clicks/hour).
  * **Circadian Score ($CS$):** Tracks late-night viewing propensity (11:00 PM – 5:00 AM local time).
  * **Hourly Alignment Heatmap:** 24-hour distribution breakdown ($0..23$) pairing semantic alignment score with total hourly click volume.
* **🛡️ Real-Time Focus Shield & Nudges:** Injects a Shadow DOM Focus Shield overlay into YouTube to display floating alignment pills, break modes, and goalpost nudges.
* **🎨 Perplexity-Inspired Minimalist Dashboard:** Designed with `rounded-[32px]` containers, ambient Dark/Light contrast modes, Recharts 24-hour circadian area charts, interactive micro-animations, and clear `[Observed Data]` vs `[Derived Estimate]` status badges.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | Python 3.11+, FastAPI 0.111, Uvicorn, Pydantic v2 | High-performance asynchronous API server & worker queue |
| **Database** | SQLite, SQLAlchemy 2.0 | Non-containerized native OS relational storage |
| **AI & NLP Engine** | PyTorch, `sentence-transformers` (`all-MiniLM-L6-v2`), NumPy, `scikit-learn` | 384-dimensional CPU vector embeddings & cosine similarity |
| **Frontend Core** | React 18, Vite 5, TypeScript 5, Axios, Lucide Icons | Responsive single-page web dashboard |
| **Styling & Charts** | Tailwind CSS 3.4, Recharts, Framer Motion | High-end minimalist design system & interactive charts |
| **External APIs (Optional)** | YouTube Data API v3, Google Gemini API | Duration/category enrichment & LLM discovery recommendations |

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers & endpoints (upload, jobs, analytics)
│   │   ├── core/         # Core system settings & environment configuration
│   │   ├── db/           # SQLite database models & session management
│   │   ├── schemas/      # Pydantic schemas & response models
│   │   ├── services/     # Parser, metrics engine, vector classifier, recommendations
│   │   └── workers/      # Asynchronous background job processor
│   ├── data/             # SQLite database storage (app.db) & temporary uploads
│   ├── tests/            # Pytest suite for classifier, metrics, & API integration
│   ├── requirements.txt  # Python backend dependencies
│   └── run_server.py     # FastAPI server launcher script
├── frontend/
│   ├── src/              # React components, hooks, styles, & API clients
│   ├── index.html        # HTML entry point
│   ├── package.json      # Node.js dependencies & scripts
│   ├── tailwind.config.js# Tailwind CSS styling configuration
│   └── vite.config.ts    # Vite bundler & API proxy configuration
├── docs/                 # System architecture documentation & diagrams
├── CONTEXT.md            # Domain glossary & metric terminology definitions
├── README.md             # Project overview & running instructions
└── watch-history.json    # Sample Google Takeout watch history export (optional)
```

---

## 🚀 Quick Start Guide: How to Run This Project

### 1. Prerequisites

Ensure you have the following installed on your machine:
* **Python 3.11+** ([Download Python](https://www.python.org/downloads/))
* **Node.js 18+ & npm** ([Download Node.js](https://nodejs.org/))

---

### 2. Exporting Google Takeout Watch History (`watch-history.json`)

To analyze your personal YouTube viewing data:
1. Navigate to [Google Takeout](https://takeout.google.com/).
2. Click **Deselect all**, then scroll down and check **YouTube and YouTube Music**.
3. Click **Multiple formats** and ensure **history** is set to **JSON** format (not HTML).
4. Click **Next step** and create your export.
5. Download and extract the archive. Locate `Takeout/YouTube and YouTube Music/history/watch-history.json`.
6. You will upload this file directly via the YBA-GAE web dashboard.

---

### 3. Backend Setup & Server Execution

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment (recommended):**
   * **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * **macOS / Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables (Optional):**
   Create a `.env` file inside the `backend/` directory (or modify the existing one):
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   * *Note: API keys are optional. If omitted, the engine uses local sentence embeddings and rule-based heuristics.*

5. **Start the FastAPI backend server:**
   ```bash
   python run_server.py
   ```
   * **API Base URL:** `http://127.0.0.1:8000`
   * **Interactive Swagger OpenAPI Docs:** `http://127.0.0.1:8000/docs`

---

### 4. Frontend Setup & Dashboard Execution

1. **Open a new terminal tab/window and navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```

4. **Access the Web Dashboard:**
   Open your browser and navigate to `http://localhost:3000`.
   *(Vite automatically proxies `/api/*` requests to the backend server at `http://127.0.0.1:8000`)*.

---

### 5. Running the Test Suite

To run backend unit and integration tests:

```bash
cd backend
pytest
```

---

## 📡 API Architecture & Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/upload` | Uploads `watch-history.json`, goal text, and optional API keys. Initializes background worker (`202 Accepted`). |
| `GET` | `/api/v1/jobs/{job_id}/status` | Real-time polling endpoint returning background job execution `progress_pct` (0%–100%) and entry status. |
| `GET` | `/api/v1/analytics/{job_id}` | Retrieves calculated metrics ($FR$, $P_n$, $SD$, $CS$), 24-hr circadian alignment breakdown, and nudge alerts. |

---

## 🔒 Privacy & Security

YBA-GAE is engineered for **100% local, privacy-first processing**:
* Raw `watch-history.json` exports and local SQLite databases (`app.db`) are excluded from source control via `.gitignore`.
* All NLP vector embeddings are computed locally on your machine's CPU using open-source PyTorch models.
* No private viewing history logs or personal identifier data are uploaded to external cloud storage.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
