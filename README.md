# YouTube Behavioral Analytics & Goal Alignment Engine (YBA-GAE)

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-SentenceTransformers-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://www.sbert.net/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**YouTube Behavioral Analytics & Goal Alignment Engine (YBA-GAE)** is a privacy-first, full-stack analytics platform that converts raw Google Takeout YouTube watch history (`watch-history.json`) into actionable behavioral insights.

By combining deterministic timestamp sequence analysis with unsupervised **PyTorch `sentence-transformers` (`all-MiniLM-L6-v2`) vector embeddings**, YBA-GAE evaluates user focus ratios, session switching velocity, circadian watching habits, and goal alignment without uploading private watch data to external cloud services.

---

## ✨ Key Features

* **⚡ Ultra-Fast Ingestion & Filtering:** Classifies 15,000+ raw Google Takeout records in **<0.1 seconds**, automatically isolating true video viewing events while stripping Community Posts, Ad impressions, and Shorts creation noise.
* **🧠 Unsupervised Semantic Goal Alignment:** Uses PyTorch 384-dimensional vector embeddings on local CPU to calculate cosine similarity between raw video metadata and personal target goals (e.g. *Software Engineering*, *Machine Learning*).
* **📊 Mathematical Engagement Proxy Engine:**
  * **Focus Ratio ($FR$):** Percentage of video events matching your target learning domain.
  * **Completion Probability ($P_n$):** Watch duration proxy derived from inter-click timestamp gaps with 30-minute session boundary rules.
  * **Session Density ($SD$):** Measures rapid channel switching and doomscrolling velocity (>15 clicks/hour flagged).
  * **Circadian Score ($CS$):** Tracks late-night viewing distribution (11:00 PM – 5:00 AM).
* **💡 Channel Replacement Recommendations:** Ranks top educational channels aligned with your goal to replace low-completion entertainment viewing.
* **🎨 Perplexity-Inspired Minimalist Dashboard:** Designed with `rounded-[32px]` containers, ambient Dark/Light contrast modes, Recharts 24-hour circadian area charts, and transparent `[Observed Data]` vs `[Derived Estimate]` badges.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Core** | Python 3.11.9, FastAPI 0.109, Uvicorn, SQLAlchemy 2.0 |
| **Database** | SQLite (non-containerized native OS storage) |
| **AI & NLP Engine** | PyTorch, `sentence-transformers` (`all-MiniLM-L6-v2`), NumPy, `scikit-learn` |
| **Frontend Core** | React 18, Vite 5, TypeScript 5, Axios, Lucide Icons |
| **Styling & Charts** | Tailwind CSS 3.4, Recharts (24-hr SVG Area Chart) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* **Python 3.11+**
* **Node.js 18+ & npm**

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI backend server
python run_server.py
```
* **API Server:** `http://127.0.0.1:8000`
* **Interactive OpenAPI Docs:** `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
* **Web Dashboard:** `http://localhost:3000`

---

## 📡 API Architecture & Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/upload` | Uploads `watch-history.json`, goal text, and optional YouTube API key. Triggers background worker (`202 Accepted`). |
| `GET` | `/api/v1/jobs/{job_id}/status` | Real-time status polling endpoint returning `progress_pct` (0% to 100%) and record counts. |
| `GET` | `/api/v1/analytics/{job_id}` | Retrieves instant pre-computed proxy metrics, composite Goal Alignment Score, and channel recommendations. |

---

## 🔒 Privacy & Security

YBA-GAE is engineered for **100% local, privacy-first processing**:
* Raw `watch-history.json` files and SQLite database stores are excluded via `.gitignore`.
* All AI embeddings are generated locally on your CPU using open-source PyTorch models.
* No raw viewing logs or personal data are transmitted to external servers.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
