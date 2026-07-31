# Wine-Q (FastAPI + React)

Wine-Q predicts wine quality using a FastAPI backend and a React (Vite) frontend.

## Backend (local)

1. Install dependencies:
   - `pip install -r requirements.txt`
2. Start API:
   - `uvicorn app:app --reload`
3. API routes:
   - `POST /predict`
   - `GET /predictions`
   - `GET /health`

## Frontend (local)

1. Create frontend env file:
   - copy `frontend/.env.example` to `frontend/.env`
2. Install dependencies:
   - `cd frontend`
   - `npm install`
3. Start frontend:
   - `npm run dev`

## Render deployment

- This repository includes `render.yaml` with:
  - `wine-q-api` as a Python web service
  - `wine-q-frontend` as a static site
- The backend service also builds `frontend/dist` and serves it at `/`, so opening the backend URL can load the UI directly.
- Update service URLs in `render.yaml` if your Render service names differ.
- Set `CORS_ALLOW_ORIGINS` on the backend to your frontend URL.
