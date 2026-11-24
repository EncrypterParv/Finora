
 cd backend
python3.13 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

DEBUG=false python -m pytest -q   # sanity check
uvicorn app.main:app --reload --port 8000

cd frontend
npm install
npm run dev   # → http://localhost:3000
