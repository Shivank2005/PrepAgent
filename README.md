# PrepMind AI

The ultimate AI-powered placement preparation platform. Stop guessing what companies ask, and start practicing with precision.

## 🚀 Features

- **DSA Practice:** Curated coding problems matched precisely to target companies.
- **Resume AI:** Automated ATS scoring, bullet point rewrites, and keyword gap analysis.
- **Company Intel:** Real interview experiences aggregated via RAG.
- **Study Roadmap:** Adaptive, week-by-week preparation plans.
- **Live Streaming Chat:** Watch the AI reasoning via Server-Sent Events.
- **DAG Visualizer:** Monitor the agent's logic transitions in real-time.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, Tailwind CSS, Framer Motion
- **Backend:** FastAPI, Python, LangChain, SQLite
- **AI Models:** Groq Llama-3.3-70b-versatile, ChromaDB

## 📦 Local Development

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in your keys (You need a Groq API Key).
3. Using Docker (Recommended):
   ```bash
   docker-compose up --build
   ```
4. Access the Marketing Site: `http://localhost:3000`
5. Access the Dashboard: `http://localhost:3000/dashboard`

## 👨‍💻 Manual Startup

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
