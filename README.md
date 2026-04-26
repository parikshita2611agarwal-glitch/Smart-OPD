# MediQueue — Smart Hospital Triage System

A full-stack multilingual (Hindi/English) hospital queue and triage system powered by Claude AI.

## Features
- 🤖 **AI Triage** — Claude analyzes symptoms and assigns urgency (HIGH/MEDIUM/LOW)
- 🗣️ **Voice Input** — Hindi & English speech-to-text via Web Speech API
- 📋 **Priority Queue** — Min-heap queue: HIGH (tokens 1–20), MEDIUM (21–60), LOW (61+)
- 📡 **Real-time** — WebSockets (Socket.io) sync doctor dashboard live
- 🌐 **Bilingual** — Full Hindi/English UI with localized AI responses
- 🏥 **ABHA Support** — ABHA Health ID field for patient linking
- 📱 **QR Token** — QR-coded tokens for reception check-in

## Tech Stack
- **Frontend**: React 18, Socket.io-client, qrcode.react
- **Backend**: Node.js, Express, Socket.io, @anthropic-ai/sdk
- **AI**: Claude claude-sonnet-4-20250514 via Anthropic API

## Quick Start

### 1. Get an Anthropic API Key
Sign up at https://console.anthropic.com and create an API key.

### 2. Set up the backend
```bash
cd backend
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm install
npm start
```
Backend runs on http://localhost:5000

### 3. Set up the frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs on http://localhost:3000

### 4. Open the app
- **Patient view**: http://localhost:3000 → "Patient Intake" tab
- **Doctor dashboard**: http://localhost:3000 → "Doctor Dashboard" tab

Open both in different windows/tabs to see real-time queue updates.

## Project Structure
```
mediqueue/
├── backend/
│   ├── index.js              # Express + Socket.io server
│   ├── routes/
│   │   ├── analyze.js        # POST /api/analyze → calls Claude
│   │   └── queue.js          # GET/DELETE /api/queue
│   ├── utils/
│   │   └── queueManager.js   # Priority queue (min-heap)
│   └── .env.example
└── frontend/
    └── src/
        ├── App.js            # Main app + all components
        ├── App.css           # Dark hospital-tech theme
        ├── hooks/
        │   └── useSocket.js  # Socket.io React hook
        └── locales/
            └── messages.js   # EN/HI translations
```

## API Reference

### POST /api/analyze
```json
{
  "symptoms": "chest pain and difficulty breathing",
  "language": "English",
  "abhaId": "12345678901234"
}
```
Returns: `{ success, patient: { token, tokenDisplay, urgency_level, condition, department, ... } }`

### GET /api/queue
Returns current sorted queue + stats.

### DELETE /api/queue/:token
Removes patient from queue (call complete).

## Urgency Scoring
| Level  | Score  | Token Range | Description        |
|--------|--------|-------------|--------------------|
| HIGH   | ≥ 80   | 001–020     | Life-threatening   |
| MEDIUM | 50–79  | 021–060     | Urgent             |
| LOW    | < 50   | 061+        | Non-urgent         |

## Deploying to Production
1. Build frontend: `cd frontend && npm run build`
2. Serve `frontend/build` via nginx or Vercel
3. Deploy backend to Railway, Render, or AWS
4. Set `REACT_APP_SOCKET_URL=https://your-backend.com` in frontend env
5. Use HTTPS everywhere (required for Web Speech API)

## Security Notes
- API key is kept server-side only — never exposed to browser
- For real ABHA linking, implement OAuth2 per ABDM guidelines
- Add rate limiting (express-rate-limit) before production use
