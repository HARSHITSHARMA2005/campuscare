# 🌸 CampusCare

> AI-powered student wellbeing support system for Indian colleges — built for placement season stress.

Students submit how they're feeling → BERT AI analyzes sentiment & priority → College counsellors see a ranked dashboard → They call the student directly.

---

## 🖥️ Pages

| Page | Route | Who sees it |
|------|-------|-------------|
| Landing Page | `/` | Everyone — students submit here |
| Auth | `/auth` | Officials only — Firebase login |
| Dashboard | `/dashboard` | Verified counsellors & admins |

---

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **Tailwind CSS**
- **Firebase Auth** (Google + Email/Password)
- **Firestore** (coming — for storing submissions)
- **BERT + XGBoost + FastAPI** (ML backend — coming next)

---

## 🚀 Run Locally (Step-by-Step)

### Step 1 — Prerequisites

Make sure you have these installed:

```bash
node --version    # Should be v18 or higher
npm --version     # Should be v9 or higher
```

If not, download Node.js from: https://nodejs.org (choose LTS version)

---

### Step 2 — Clone the Repo

```bash
# If you've pushed to GitHub:
git clone https://github.com/YOUR_USERNAME/campuscare.git
cd campuscare

# OR if running locally from downloaded folder:
cd campuscare-next
```

---

### Step 3 — Install Dependencies

```bash
npm install
```

This installs Next.js, React, Firebase, Tailwind, and everything else from `package.json`.

---

### Step 4 — Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** → name it `campuscare`
3. Go to **Project Settings** → **Your Apps** → Click **Web** (</> icon)
4. Register the app, copy the config object
5. In the project root, create a file called **`.env.local`**:

```bash
# Create the file
touch .env.local
```

6. Paste this into `.env.local` and fill in your values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

7. In Firebase Console → **Authentication** → **Sign-in method** → Enable:
   - ✅ Email/Password
   - ✅ Google

> ⚠️ **Never commit `.env.local` to GitHub.** It's already in `.gitignore`.

---

### Step 5 — Run the Dev Server

```bash
npm run dev
```

Open your browser and go to:

```
http://localhost:3000
```

| Page | URL |
|------|-----|
| Landing Page | http://localhost:3000 |
| Auth / Login | http://localhost:3000/auth |
| Dashboard | http://localhost:3000/dashboard |

---

### Step 6 — Build for Production (optional)

```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
campuscare-next/
├── src/
│   ├── app/
│   │   ├── layout.jsx          # Root layout
│   │   ├── globals.css         # Global styles + animations
│   │   ├── page.jsx            # Landing page (/)
│   │   ├── auth/
│   │   │   └── page.jsx        # Login/Signup (/auth)
│   │   └── dashboard/
│   │       └── page.jsx        # Officials dashboard (/dashboard)
│   ├── components/
│   │   ├── PetalCanvas.jsx     # Falling petals canvas animation
│   │   └── Clouds.jsx          # Drifting cloud SVGs
│   └── lib/
│       └── firebase.js         # Firebase init & exports
├── public/                     # Static assets
├── .env.example                # Template for env vars
├── .env.local                  # Your actual secrets (NOT committed)
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

---

## 🐙 Push to GitHub

### First time setup:

```bash
# 1. Initialize git (if not already)
git init

# 2. Add all files
git add .

# 3. First commit
git commit -m "🌸 Initial commit — CampusCare frontend"

# 4. Create a new repo on GitHub (github.com → New repository)
#    Name it: campuscare
#    Keep it Public or Private — your choice
#    Do NOT initialize with README (you already have one)

# 5. Connect and push
git remote add origin https://github.com/YOUR_USERNAME/campuscare.git
git branch -M main
git push -u origin main
```

### Future updates:

```bash
git add .
git commit -m "your message here"
git push
```

---

## 🔮 Coming Next

- [ ] **Firestore integration** — store student submissions in real-time DB
- [ ] **Firebase Auth rules** — restrict dashboard to approved emails only
- [ ] **FastAPI backend** — REST API for ML inference
- [ ] **BERT sentiment model** — fine-tuned on student distress text
- [ ] **XGBoost classifier** — severity scoring (Urgent / High / Medium / Low)
- [ ] **Twilio / Exotel** — real call integration from dashboard
- [ ] **Deploy on Vercel** — one-click deploy

---

## 👤 Author

Built as a resume project — NSUT Delhi  
Stack: Next.js · React · Firebase · BERT · XGBoost · FastAPI

---

## 📄 License

MIT — free to use and modify.
