from transformers import pipeline
import numpy as np
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
import re

# ── LOAD LIGHTWEIGHT EMOTION MODEL ──
print("Loading emotion model...")
emotion_classifier = pipeline(
    "text-classification",
    model="bhadresh-savani/distilbert-base-uncased-emotion",
    top_k=None,
    device=-1
)
print("✅ Model loaded!")

# ── URGENCY KEYWORDS ──
URGENT_KEYWORDS = [
    'hopeless', 'give up', 'cannot', "can't", 'worthless', 'alone',
    'nobody', 'disappear', 'end it', 'no point', 'failure', 'useless',
    'rejected', 'suicidal', 'die', 'hurt myself', 'nothing matters'
]

HIGH_KEYWORDS = [
    'stressed', 'anxiety', 'pressure', 'overwhelmed', 'exhausted',
    'frustrated', 'angry', 'crying', 'panic', 'scared', 'worried',
    'depressed', 'lost', 'broken', 'failed', 'terrible'
]

# ── EMOTION MAPPING ──
# bhadresh model outputs: sadness, joy, love, anger, fear, surprise
def normalize_emotions(raw: dict) -> dict:
    return {
        'fear': raw.get('fear', 0),
        'sadness': raw.get('sadness', 0),
        'anger': raw.get('anger', 0),
        'disgust': raw.get('anger', 0) * 0.5,  # approximate
        'joy': raw.get('joy', 0),
        'neutral': raw.get('surprise', 0),
    }

# ── FEATURE EXTRACTION ──
def extract_features(text: str, emotions: dict) -> np.ndarray:
    text_lower = text.lower()

    fear_score = emotions.get('fear', 0)
    sadness_score = emotions.get('sadness', 0)
    anger_score = emotions.get('anger', 0)
    disgust_score = emotions.get('disgust', 0)
    joy_score = emotions.get('joy', 0)
    neutral_score = emotions.get('neutral', 0)

    word_count = len(text.split())
    char_count = len(text)
    sentence_count = len(re.split(r'[.!?]+', text))
    avg_word_length = char_count / max(word_count, 1)

    urgent_count = sum(1 for kw in URGENT_KEYWORDS if kw in text_lower)
    high_count = sum(1 for kw in HIGH_KEYWORDS if kw in text_lower)

    exclamation_count = text.count('!')
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)

    features = np.array([[
        fear_score,
        sadness_score,
        anger_score,
        disgust_score,
        joy_score,
        neutral_score,
        fear_score + sadness_score + anger_score + disgust_score,
        word_count / 100,
        urgent_count,
        high_count,
        exclamation_count,
        caps_ratio,
        sentence_count,
        avg_word_length / 10,
    ]])

    return features

# ── RULE-BASED PRIORITY SCORING ──
def rule_based_score(text: str, emotions: dict) -> tuple:
    text_lower = text.lower()
    fear = emotions.get('fear', 0)
    sadness = emotions.get('sadness', 0)
    anger = emotions.get('anger', 0)
    disgust = emotions.get('disgust', 0)

    distress = fear + sadness + anger + disgust
    urgent_hits = sum(1 for kw in URGENT_KEYWORDS if kw in text_lower)
    high_hits = sum(1 for kw in HIGH_KEYWORDS if kw in text_lower)
    wc = len(text.split())

    if urgent_hits >= 1 or distress > 1.5:
        priority = 'Urgent'
        score = min(99, 80 + urgent_hits * 5 + int(distress * 5))
    elif high_hits >= 2 or distress > 0.9 or wc > 80:
        priority = 'High'
        score = min(79, 55 + high_hits * 4 + int(distress * 8))
    elif distress > 0.4 or wc > 40:
        priority = 'Medium'
        score = min(54, 25 + int(distress * 15) + high_hits * 3)
    else:
        priority = 'Low'
        score = max(5, int(distress * 20))

    return priority, score

# ── TRAIN XGBOOST ──
def train_xgboost():
    print("Training XGBoost model...")

    training_texts = [
        "I feel completely hopeless. I can't go on like this anymore.",
        "Rejected from every company. I want to give up.",
        "Nobody understands me. I feel so alone and worthless.",
        "I'm extremely stressed about placements. Anxiety is killing me.",
        "Failed my interview again. I'm broken inside.",
        "My parents are pressuring me so much. I'm overwhelmed.",
        "Feeling a bit anxious about upcoming interviews.",
        "Stressed about deadlines but managing okay.",
        "Had a rough week but things will get better.",
        "Just need someone to talk to about career confusion.",
        "Minor issue with my resume. Not urgent.",
        "Curious about internship opportunities.",
        "Everything is falling apart. I cannot handle this anymore.",
        "I've been crying every night. The pressure is unbearable.",
        "Lost three offers in one week. I feel like a complete failure.",
        "Somewhat worried about placement season starting soon.",
        "Need guidance on which companies to apply to.",
        "Feeling numb and disconnected from everything around me.",
        "I haven't slept in days due to rejection anxiety.",
        "A bit nervous but excited about upcoming campus drives.",
    ]

    priorities = [
        'Urgent', 'Urgent', 'Urgent',
        'High', 'High', 'High',
        'Medium', 'Medium', 'Medium', 'Medium',
        'Low', 'Low',
        'Urgent', 'Urgent', 'High',
        'Medium', 'Low',
        'High', 'High', 'Low',
    ]

    le = LabelEncoder()
    le.fit(['Low', 'Medium', 'High', 'Urgent'])
    y = le.transform(priorities)

    X_list = []
    for text in training_texts:
        results = emotion_classifier(text[:512])
        raw = {r['label']: r['score'] for r in results[0]}
        emotions = normalize_emotions(raw)
        features = extract_features(text, emotions)
        X_list.append(features[0])

    X = np.array(X_list)

    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        eval_metric='mlogloss',
        random_state=42
    )
    model.fit(X, y)
    print("✅ XGBoost trained!")
    return model, le

# ── INITIALIZE ──
xgb_model, label_encoder = train_xgboost()

# ── PREDICT ──
def predict_priority(text: str) -> dict:
    results = emotion_classifier(text[:512])
    raw = {r['label']: r['score'] for r in results[0]}
    emotions = normalize_emotions(raw)

    features = extract_features(text, emotions)

    pred_class = xgb_model.predict(features)[0]
    pred_proba = xgb_model.predict_proba(features)[0]
    priority = label_encoder.inverse_transform([pred_class])[0]
    confidence = float(max(pred_proba)) * 100

    _, rule_score = rule_based_score(text, emotions)

    priority_weights = {'Urgent': 1.0, 'High': 0.75, 'Medium': 0.45, 'Low': 0.2}
    weight = priority_weights[priority]
    final_score = int((rule_score * 0.6) + (confidence * weight * 0.4))
    final_score = max(5, min(99, final_score))

    return {
        'priority': priority,
        'score': final_score,
        'confidence': round(confidence, 1),
        'emotions': {k: round(v * 100, 1) for k, v in emotions.items()},
        'distress_level': round((emotions.get('fear', 0) + emotions.get('sadness', 0) + emotions.get('anger', 0) + emotions.get('disgust', 0)) * 100, 1),
        'urgency': round(emotions.get('fear', 0) * 100 + emotions.get('anger', 0) * 50, 1),
        'isolation_risk': round(emotions.get('sadness', 0) * 100, 1),
        'ai_analyzed': True,
    }
