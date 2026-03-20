# يَوْم — Yawm
### My Daily Islamic Deeds Tracker

---

## 🚀 Deploy to Vercel (5 minutes)

### Step 1 — Create a free Vercel account
Go to https://vercel.com and sign up (free, no credit card needed).

### Step 2 — Install Node.js (if you haven't already)
Download from https://nodejs.org — choose the "LTS" version.

### Step 3 — Build the app
Open Terminal (Mac/Linux) or Command Prompt (Windows), navigate to this folder, then run:

```bash
npm install
npm run build
```

This creates a `build/` folder — that's your finished app.

### Step 4 — Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

Follow the prompts (press Enter to accept defaults).
You'll get a live URL like: **https://yawm.vercel.app**

---

## 📱 Install as PWA on your phone

### iPhone (Safari):
1. Open your Vercel URL in Safari
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**
5. Done — Yawm is now on your home screen!

### Android (Chrome):
1. Open your Vercel URL in Chrome
2. Tap the **three dots** menu
3. Tap **Install App** or **Add to Home Screen**
4. Done!

---

## 💻 Run locally (no internet needed after setup)

```bash
npm install
npm start
```

Opens at http://localhost:3000

---

## 📁 Project Structure

```
yawm/
├── public/
│   ├── index.html        # App shell
│   ├── manifest.json     # PWA config
│   ├── service-worker.js # Offline support
│   ├── icon-192.png      # App icon
│   └── icon-512.png      # App icon (large)
├── src/
│   ├── index.js          # Entry point
│   └── App.jsx           # Main app
└── package.json
```

---

## ✨ Features
- ✅ 5 daily prayers with Fard / Sunnah / Nafl / Witr checkboxes
- 🌙 Ramadan mode with Tarawih
- 📿 Adhkar, Quran, Sadaqah tracking
- 🌿 Sunnah fasting (Mon/Thu/White Days)
- 🕌 Jumu'ah & Surah Al-Kahf on Fridays
- 📅 Monthly calendar heatmap
- 🔥 Streak tracker
- 🤲 Daily rotating dua
- 📝 Notes on any deed
- 🌙/☀️ Dark & light mode
- 📍 Location-aware Hijri date (via Aladhan API)
- ✏️ Manual Hijri date override
- ➕ Custom deeds
- 📱 Installable PWA — works offline

---

بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
