# CodeTrack v2 — LeetCode Assignment Manager

Real LeetCode stats + email notifications.

## Setup (2 minutes)

```bash
npm install
node server.js
```
Then open `index.html` in your browser.

---

## ✉ Email Setup (Gmail)

1. Enable **2-Step Verification** on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Create an App Password for "Mail"
4. In the app → **Notifications tab** → fill in:
   - SMTP Host: `smtp.gmail.com`
   - Port: `587`
   - Email: your Gmail address
   - App Password: the 16-char password from step 3
   - Staff Email: where you want alerts sent
5. Click **SAVE CONFIG** then **SEND TEST** to verify

> Other providers: Outlook uses `smtp.office365.com:587`, Yahoo uses `smtp.mail.yahoo.com:587`

---

## 📊 LeetCode Stats (requires server running)

When you click **VIEW STATS** on a student card or **⟳ SYNC LC**, the app fetches:

| Feature | Details |
|---------|---------|
| Solve counts | Easy / Medium / Hard breakdown with donut chart |
| Current streak | 🔥 streak days |
| Total active days | All-time activity |
| Submission heatmap | Last 52 weeks, colour-coded |
| Top languages | Bar chart of most used languages |
| Top topics | Tags like Array, DP, Graph |
| Badges | All earned LeetCode badges |
| Recent submissions | Last 15 with Accepted/Failed status |

---

## 🔔 Notification Events

| Event | Who gets notified |
|-------|------------------|
| Student manually marked done | Staff email |
| Student marked done + has email | Staff + student |
| All students finish a problem | Special "All Done!" email to staff |
| LeetCode sync finds new completion | Staff (if not manual-only mode) |

---

## 🛠 Environment Variables (optional)

Instead of editing `server.js`, you can use env vars:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your@gmail.com
STAFF_EMAIL=staff@college.edu
```

```bash
SMTP_USER=you@gmail.com SMTP_PASS=xxxx STAFF_EMAIL=staff@uni.edu node server.js
```

---

## File Structure

```
codetrack/
├── server.js      ← Express backend (LeetCode proxy + email)
├── index.html     ← Frontend dashboard
├── package.json
└── README.md
```
