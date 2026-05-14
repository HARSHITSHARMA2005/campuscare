import multiprocessing
multiprocessing.freeze_support()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="CampusCare AI API",
    description="BERT + XGBoost student distress analysis API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── FIREBASE ADMIN ──
import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ── LOAD MODEL ON STARTUP ──
@app.on_event("startup")
async def load_model():
    from model import predict_priority
    app.state.predict = predict_priority
    print("✅ Model ready!")

# ── REQUEST MODELS ──
class AnalyzeRequest(BaseModel):
    text: str
    name: str = ""
    college: str = ""
    topic: str = ""
    phone: str = ""

class EmailRequest(BaseModel):
    name: str
    phone: str
    college: str
    topic: str
    priority: str
    score: int
    mood: str = ""
    text: str = ""
    year: str = ""
    calltime: str = ""

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
        raise HTTPException(status_code=400, detail="Text too long.")
    try:
        result = app.state.predict(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── GET COUNSELLOR EMAIL FROM FIRESTORE ──
def get_counsellor_email(college: str) -> str:
    try:
        college_clean = college.split("—")[0].strip()
        docs = db.collection("approvedOfficials")\
                  .where("college", "==", college_clean)\
                  .limit(1)\
                  .stream()
        for doc in docs:
            data = doc.to_dict()
            email = data.get("email")
            if email:
                return email
        return os.getenv("GMAIL_TO", "")
    except Exception as e:
        print(f"Firestore lookup error: {e}")
        return os.getenv("GMAIL_TO", "")

# ── SEND GMAIL ALERT ──
@app.post("/send-email")
def send_email(request: EmailRequest):
    try:
        gmail_user = os.getenv("GMAIL_USER")
        gmail_password = os.getenv("GMAIL_APP_PASSWORD")

        if not all([gmail_user, gmail_password]):
            raise HTTPException(
                status_code=500,
                detail="Gmail credentials not configured."
            )

        # Get counsellor email from Firestore
        to_email = get_counsellor_email(request.college)
        if not to_email:
            raise HTTPException(
                status_code=500,
                detail="No counsellor email found for this college."
            )

        # Priority styling
        if request.priority == "Urgent":
            emoji = "🚨"
            color = "#d4547a"
            action = "URGENT — Please call immediately!"
            border_color = "#d4547a"
        elif request.priority == "High":
            emoji = "⚠️"
            color = "#e8804a"
            action = "HIGH PRIORITY — Please call within 1 hour."
            border_color = "#e8804a"
        else:
            emoji = "📋"
            color = "#d4a054"
            action = "Please call within 24 hours."
            border_color = "#d4a054"

        # Beautiful HTML email
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#fdf8f4;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:36px;margin-bottom:8px;">🌸</div>
      <div style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#d4547a;">CampusCare</div>
      <div style="font-size:13px;color:#b08888;margin-top:4px;">Student Wellbeing Alert System</div>
    </div>

    <!-- Alert Card -->
    <div style="background:#fff;border-radius:20px;border:2px solid {border_color};overflow:hidden;box-shadow:0 8px 32px rgba(212,84,122,0.1);">

      <!-- Priority Banner -->
      <div style="background:{color};padding:16px 24px;display:flex;align-items:center;gap:12px;">
        <span style="font-size:24px;">{emoji}</span>
        <div>
          <div style="color:#fff;font-weight:700;font-size:16px;">{request.priority} PRIORITY ALERT</div>
          <div style="color:rgba(255,255,255,0.85);font-size:13px;">{action}</div>
        </div>
        <div style="margin-left:auto;background:rgba(255,255,255,0.2);border-radius:100px;padding:6px 14px;">
          <span style="color:#fff;font-size:18px;font-weight:700;">{request.score}/100</span>
        </div>
      </div>

      <!-- Student Info -->
      <div style="padding:24px;">
        <div style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#3d2c2c;margin-bottom:16px;">Student Details</div>

        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #f0d8d8;">
            <td style="padding:10px 0;color:#b08888;font-size:13px;width:120px;">👤 Name</td>
            <td style="padding:10px 0;color:#3d2c2c;font-weight:500;font-size:13px;">{request.name}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0d8d8;">
            <td style="padding:10px 0;color:#b08888;font-size:13px;">📱 Phone</td>
            <td style="padding:10px 0;font-size:13px;">
              <a href="tel:{request.phone.replace(' ','')}" style="color:#d4547a;font-weight:600;text-decoration:none;">{request.phone}</a>
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0d8d8;">
            <td style="padding:10px 0;color:#b08888;font-size:13px;">🏫 College</td>
            <td style="padding:10px 0;color:#3d2c2c;font-weight:500;font-size:13px;">{request.college}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0d8d8;">
            <td style="padding:10px 0;color:#b08888;font-size:13px;">📚 Year</td>
            <td style="padding:10px 0;color:#3d2c2c;font-size:13px;">{request.year}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0d8d8;">
            <td style="padding:10px 0;color:#b08888;font-size:13px;">😔 Mood</td>
            <td style="padding:10px 0;color:#3d2c2c;font-size:13px;">{request.mood}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0d8d8;">
            <td style="padding:10px 0;color:#b08888;font-size:13px;">📋 Topic</td>
            <td style="padding:10px 0;color:#3d2c2c;font-size:13px;">{request.topic}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#b08888;font-size:13px;">🕐 Best Time</td>
            <td style="padding:10px 0;color:#3d2c2c;font-size:13px;">{request.calltime}</td>
          </tr>
        </table>

        <!-- What they said -->
        <div style="margin-top:20px;background:#fef3f0;border-radius:14px;padding:16px;border-left:4px solid {color};">
          <div style="font-size:12px;color:#b08888;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">What they shared</div>
          <div style="font-size:14px;color:#7a5c5c;line-height:1.7;font-style:italic;">"{request.text}"</div>
        </div>

        <!-- AI Score -->
        <div style="margin-top:16px;background:rgba(212,84,122,0.05);border-radius:14px;padding:14px;border:1px solid rgba(212,84,122,0.15);">
          <div style="font-size:12px;color:#b08888;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">🧠 AI Analysis</div>
          <div style="font-size:13px;color:#3d2c2c;">Distress Score: <strong style="color:{color};">{request.score}/100</strong> · Priority: <strong style="color:{color};">{request.priority}</strong></div>
          <div style="font-size:12px;color:#b08888;margin-top:4px;">Analyzed by BERT + XGBoost sentiment model</div>
        </div>

        <!-- CTA Button -->
        <div style="text-align:center;margin-top:24px;">
          <a href="http://localhost:3000/dashboard" style="display:inline-block;background:linear-gradient(135deg,#d4547a,#f0408a);color:#fff;text-decoration:none;padding:14px 36px;border-radius:100px;font-weight:500;font-size:15px;box-shadow:0 6px 24px rgba(212,84,122,0.35);">
            Open Dashboard →
          </a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;font-size:12px;color:#b08888;line-height:1.6;">
      <div>🌸 CampusCare — Student Wellbeing System</div>
      <div style="margin-top:4px;">This is an automated alert. Please respond promptly.</div>
    </div>
  </div>
</body>
</html>
"""

        # Create email
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"{emoji} CampusCare Alert: {request.priority} Priority — {request.name} ({request.college.split('—')[0].strip()})"
        msg['From'] = f"CampusCare <{gmail_user}>"
        msg['To'] = to_email

        # Plain text fallback
        plain_text = f"""
CampusCare Student Alert {emoji}

{request.priority} PRIORITY — {action}

Student: {request.name}
Phone: {request.phone}
College: {request.college}
Mood: {request.mood}
Topic: {request.topic}
AI Score: {request.score}/100

What they shared:
"{request.text}"

Login to dashboard: http://localhost:3000/dashboard

— CampusCare AI System 🌸
"""
        msg.attach(MIMEText(plain_text, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        # Send via Gmail SMTP
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, to_email, msg.as_string())

        return {
            "status": "✅ Email alert sent!",
            "sent_to": to_email,
            "subject": msg['Subject']
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── RUN ──
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )