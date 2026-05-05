import multiprocessing
multiprocessing.freeze_support()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# ── FASTAPI APP ──
app = FastAPI(
    title="CampusCare AI API",
    description="BERT + XGBoost student distress analysis API",
    version="1.0.0"
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── LOAD MODEL ONCE ON STARTUP ──
@app.on_event("startup")
async def load_model():
    from model import predict_priority
    app.state.predict = predict_priority
    print("✅ Model ready!")

# ── REQUEST MODEL ──
class AnalyzeRequest(BaseModel):
    text: str
    name: str = ""
    college: str = ""
    topic: str = ""

# ── ROUTES ──
@app.get("/")
def root():
    return {
        "status": "✅ CampusCare AI API is running",
        "model": "j-hartmann/emotion-english-distilroberta-base",
        "classifier": "XGBoost",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    if not request.text or len(request.text.strip()) < 5:
        raise HTTPException(status_code=400, detail="Text too short.")
    if len(request.text) > 2000:
        raise HTTPException(status_code=400, detail="Text too long. Max 2000 characters.")
    try:
        result = app.state.predict(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── RUN ──
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False  # ← disable reload on Windows
    )