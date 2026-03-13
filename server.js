const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3001;

app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── Config (edit these) ──────────────────────────────────────────────────────
// Set your SMTP credentials here or via environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "your_email@gmail.com",
    pass: process.env.SMTP_PASS || "your_app_password", // Gmail App Password
  },
};
const FROM_EMAIL = process.env.FROM_EMAIL || '"CodeTrack 🎯" <your_email@gmail.com>';
const STAFF_EMAIL = process.env.STAFF_EMAIL || "staff@example.com"; // where staff notifications go

// ─── LeetCode GraphQL ─────────────────────────────────────────────────────────
const LC_API = "https://leetcode.com/graphql";
const HEADERS = {
  "Content-Type": "application/json",
  Referer: "https://leetcode.com",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

async function lcQuery(query, variables = {}) {
  const res = await fetch(LC_API, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LeetCode API ${res.status}`);
  return res.json();
}

// ─── Nodemailer transporter ───────────────────────────────────────────────────
let transporter = null;
function getTransporter() {
  if (!transporter) transporter = nodemailer.createTransport(EMAIL_CONFIG);
  return transporter;
}

// ─── Email Templates ──────────────────────────────────────────────────────────
function emailStudentCompleted({ studentName, studentEmail, problemTitle, problemId, diff, solvedAt, lang }) {
  return {
    from: FROM_EMAIL,
    to: studentEmail,
    subject: `✅ Problem Solved: #${problemId} ${problemTitle}`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0c10;font-family:'Segoe UI',sans-serif">
<div style="max-width:520px;margin:32px auto;background:#111318;border:1px solid #1e2330;border-radius:12px;overflow:hidden">
  <div style="background:#f0b429;padding:20px 28px">
    <h1 style="margin:0;font-size:20px;color:#0a0c10;font-weight:800">✅ Problem Solved!</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#0a0c10;opacity:0.75">CodeTrack Assignment Tracker</p>
  </div>
  <div style="padding:28px">
    <p style="color:#e8eaf0;font-size:15px;margin-bottom:20px">Hey <strong>${studentName}</strong>, great work! 🎉</p>
    <div style="background:#181b22;border:1px solid #2a3044;border-radius:8px;padding:18px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <span style="color:#6b7280;font-size:12px">PROBLEM</span>
        <span style="color:#f0b429;font-size:12px">#${problemId}</span>
      </div>
      <div style="color:#e8eaf0;font-size:16px;font-weight:600;margin-bottom:12px">${problemTitle}</div>
      <div style="display:flex;gap:12px">
        <span style="background:${diff==='Easy'?'rgba(0,230,118,0.15)':diff==='Medium'?'rgba(240,180,41,0.15)':'rgba(255,107,107,0.15)'};color:${diff==='Easy'?'#00e676':diff==='Medium'?'#f0b429':'#ff6b6b'};padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600">${diff}</span>
        <span style="background:rgba(79,195,247,0.12);color:#4fc3f7;padding:3px 10px;border-radius:4px;font-size:11px">${lang || 'N/A'}</span>
      </div>
    </div>
    <p style="color:#6b7280;font-size:12px;margin:0">Solved at: ${solvedAt}</p>
  </div>
  <div style="padding:16px 28px;border-top:1px solid #1e2330;text-align:center">
    <a href="https://leetcode.com/problems/${problemTitle.toLowerCase().replace(/\s+/g,'-')}/" style="color:#4fc3f7;font-size:12px;text-decoration:none">View Problem on LeetCode →</a>
  </div>
</div></body></html>`,
  };
}

function emailStaffNotification({ studentName, studentRoll, lcUsername, problemTitle, problemId, diff, solvedAt, allStudents, completedCount }) {
  const pct = allStudents ? Math.round((completedCount / allStudents) * 100) : 0;
  return {
    from: FROM_EMAIL,
    to: STAFF_EMAIL,
    subject: `📬 ${studentName} solved #${problemId} ${problemTitle}`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0c10;font-family:'Segoe UI',sans-serif">
<div style="max-width:520px;margin:32px auto;background:#111318;border:1px solid #1e2330;border-radius:12px;overflow:hidden">
  <div style="background:#181b22;padding:20px 28px;border-bottom:1px solid #1e2330">
    <h1 style="margin:0;font-size:18px;color:#e8eaf0;font-weight:700">📬 Submission Alert</h1>
    <p style="margin:4px 0 0;font-size:12px;color:#6b7280">CodeTrack — Staff Notification</p>
  </div>
  <div style="padding:28px">
    <div style="background:#181b22;border:1px solid #2a3044;border-radius:8px;padding:18px;margin-bottom:16px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="color:#6b7280;font-size:11px;padding:5px 0">STUDENT</td><td style="color:#e8eaf0;font-size:13px;text-align:right;font-weight:600">${studentName}</td></tr>
        <tr><td style="color:#6b7280;font-size:11px;padding:5px 0">ROLL NO</td><td style="color:#e8eaf0;font-size:13px;text-align:right">${studentRoll}</td></tr>
        <tr><td style="color:#6b7280;font-size:11px;padding:5px 0">LEETCODE ID</td><td style="color:#4fc3f7;font-size:13px;text-align:right">${lcUsername}</td></tr>
        <tr><td style="color:#6b7280;font-size:11px;padding:5px 0">PROBLEM</td><td style="color:#f0b429;font-size:13px;text-align:right">#${problemId} — ${problemTitle}</td></tr>
        <tr><td style="color:#6b7280;font-size:11px;padding:5px 0">DIFFICULTY</td><td style="font-size:13px;text-align:right;color:${diff==='Easy'?'#00e676':diff==='Medium'?'#f0b429':'#ff6b6b'}">${diff}</td></tr>
        <tr><td style="color:#6b7280;font-size:11px;padding:5px 0">SOLVED AT</td><td style="color:#9ca3af;font-size:12px;text-align:right">${solvedAt}</td></tr>
      </table>
    </div>
    <div style="background:#181b22;border:1px solid #2a3044;border-radius:8px;padding:14px">
      <div style="color:#6b7280;font-size:10px;letter-spacing:1px;margin-bottom:8px">CLASS PROGRESS FOR THIS PROBLEM</div>
      <div style="background:#0a0c10;border-radius:4px;height:6px;overflow:hidden;margin-bottom:6px">
        <div style="width:${pct}%;height:100%;background:#00e676;border-radius:4px"></div>
      </div>
      <div style="color:#9ca3af;font-size:11px">${completedCount} / ${allStudents} students completed (${pct}%)</div>
    </div>
  </div>
</div></body></html>`,
  };
}

function emailAllDone({ problemTitle, problemId, totalStudents }) {
  return {
    from: FROM_EMAIL,
    to: STAFF_EMAIL,
    subject: `🎉 All students completed #${problemId} ${problemTitle}!`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0c10;font-family:'Segoe UI',sans-serif">
<div style="max-width:520px;margin:32px auto;background:#111318;border:1px solid rgba(0,230,118,0.3);border-radius:12px;overflow:hidden">
  <div style="background:rgba(0,230,118,0.15);padding:28px;text-align:center">
    <div style="font-size:48px;margin-bottom:8px">🎉</div>
    <h1 style="margin:0;font-size:22px;color:#00e676;font-weight:800">All Done!</h1>
    <p style="margin:6px 0 0;color:#9ca3af;font-size:13px">Every student completed the assignment</p>
  </div>
  <div style="padding:28px;text-align:center">
    <div style="color:#f0b429;font-size:18px;font-weight:700">#${problemId} — ${problemTitle}</div>
    <div style="color:#6b7280;font-size:13px;margin-top:8px">All ${totalStudents} students submitted ✓</div>
  </div>
</div></body></html>`,
  };
}

// ─── Route: POST /notify ──────────────────────────────────────────────────────
// Body: { type, studentName, studentEmail?, studentRoll, lcUsername, problemTitle, problemId, diff, solvedAt, allStudents, completedCount }
app.post("/notify", async (req, res) => {
  const { type, studentEmail, ...rest } = req.body;
  if (!type) return res.status(400).json({ error: "type required" });

  try {
    const tp = getTransporter();
    const emails = [];

    if (type === "completed") {
      // 1. Notify staff
      emails.push(emailStaffNotification({ ...rest }));
      // 2. Notify student if email provided
      if (studentEmail) emails.push(emailStudentCompleted({ ...rest, studentEmail }));
      // 3. If everyone done, send special email
      if (rest.completedCount >= rest.allStudents && rest.allStudents > 0) {
        emails.push(emailAllDone({ problemTitle: rest.problemTitle, problemId: rest.problemId, totalStudents: rest.allStudents }));
      }
    }

    await Promise.all(emails.map((mail) => tp.sendMail(mail)));
    res.json({ sent: emails.length });
  } catch (err) {
    console.error("[notify]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Route: POST /test-email ──────────────────────────────────────────────────
app.post("/test-email", async (req, res) => {
  try {
    const tp = getTransporter();
    await tp.verify();
    await tp.sendMail({
      from: FROM_EMAIL,
      to: req.body.to || STAFF_EMAIL,
      subject: "✅ CodeTrack Email Test",
      text: "Email notifications are working correctly!",
    });
    res.json({ ok: true, message: "Test email sent!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Route: GET /profile/:username (extended with streaks + badges + langs) ───
app.get("/profile/:username", async (req, res) => {
  const { username } = req.params;

  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          ranking
          reputation
          starRating
          aboutMe
          school
          countryName
          company
          websites
          skillTags
          userAvatar
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        badges {
          id
          displayName
          icon
          creationDate
        }
        activeBadge {
          id
          displayName
          icon
        }
        userCalendar(year: 0) {
          streak
          totalActiveDays
          dccBadges {
            timestamp
            badge { name icon }
          }
          submissionCalendar
        }
        languageProblemCount {
          languageName
          problemsSolved
        }
        tagProblemCounts {
          advanced {
            tagName
            tagSlug
            problemsSolved
          }
          intermediate {
            tagName
            tagSlug
            problemsSolved
          }
          fundamental {
            tagName
            tagSlug
            problemsSolved
          }
        }
        recentSubmissionList(limit: 15) {
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    }
  `;

  try {
    const data = await lcQuery(query, { username });
    const user = data?.data?.matchedUser;
    if (!user) return res.status(404).json({ error: "User not found on LeetCode" });

    const stats = user.submitStats?.acSubmissionNum || [];
    const getCount = (diff) => stats.find((s) => s.difficulty === diff)?.count || 0;
    const getTotalSubs = (diff) => stats.find((s) => s.difficulty === diff)?.submissions || 0;

    const calendar = user.userCalendar || {};
    const submissionCalendar = calendar.submissionCalendar
      ? JSON.parse(calendar.submissionCalendar)
      : {};

    // Build heatmap — last 52 weeks
    const heatmap = [];
    const now = Math.floor(Date.now() / 1000);
    for (let i = 364; i >= 0; i--) {
      const ts = now - i * 86400;
      const dayKey = Math.floor(ts / 86400) * 86400;
      heatmap.push({ date: new Date(ts * 1000).toISOString().split("T")[0], count: submissionCalendar[dayKey] || 0 });
    }

    // Top languages
    const languages = (user.languageProblemCount || [])
      .sort((a, b) => b.problemsSolved - a.problemsSolved)
      .slice(0, 6);

    // Top tags
    const allTags = [
      ...(user.tagProblemCounts?.advanced || []),
      ...(user.tagProblemCounts?.intermediate || []),
      ...(user.tagProblemCounts?.fundamental || []),
    ].sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 8);

    const recent = (user.recentSubmissionList || []).map((s) => ({
      title: s.title,
      slug: s.titleSlug,
      status: s.statusDisplay,
      lang: s.lang,
      accepted: s.statusDisplay === "Accepted",
      time: new Date(parseInt(s.timestamp) * 1000).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
      url: `https://leetcode.com/problems/${s.titleSlug}/`,
    }));

    res.json({
      username: user.username,
      realName: user.profile?.realName || "",
      avatar: user.profile?.userAvatar || "",
      ranking: user.profile?.ranking || 0,
      reputation: user.profile?.reputation || 0,
      country: user.profile?.countryName || "",
      company: user.profile?.company || "",
      school: user.profile?.school || "",
      skills: user.profile?.skillTags || [],
      solved: {
        total: getCount("All"),
        easy: getCount("Easy"),
        medium: getCount("Medium"),
        hard: getCount("Hard"),
        easyTotal: getTotalSubs("Easy"),
        mediumTotal: getTotalSubs("Medium"),
        hardTotal: getTotalSubs("Hard"),
      },
      streak: {
        current: calendar.streak || 0,
        totalActiveDays: calendar.totalActiveDays || 0,
      },
      badges: (user.badges || []).map((b) => ({
        id: b.id,
        name: b.displayName,
        icon: b.icon,
        date: b.creationDate,
      })),
      activeBadge: user.activeBadge || null,
      heatmap,
      languages,
      topTags: allTags,
      recentSubmissions: recent,
    });
  } catch (err) {
    console.error(`[profile] ${username}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Route: POST /check-problem ───────────────────────────────────────────────
app.post("/check-problem", async (req, res) => {
  const { username, problemSlug } = req.body;
  if (!username || !problemSlug)
    return res.status(400).json({ error: "username and problemSlug required" });

  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        title titleSlug timestamp lang
      }
    }
  `;
  try {
    const data = await lcQuery(query, { username, limit: 100 });
    const list = data?.data?.recentAcSubmissionList || [];
    const match = list.find((s) => s.titleSlug.toLowerCase() === problemSlug.toLowerCase());
    if (match) {
      res.json({
        solved: true,
        time: new Date(parseInt(match.timestamp) * 1000).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
        lang: match.lang,
      });
    } else {
      res.json({ solved: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Route: POST /bulk-check ──────────────────────────────────────────────────
app.post("/bulk-check", async (req, res) => {
  const { students, problems } = req.body;
  if (!students?.length || !problems?.length)
    return res.status(400).json({ error: "students and problems required" });

  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        titleSlug timestamp lang
      }
    }
  `;

  const results = await Promise.allSettled(
    students.map(async (student) => {
      const data = await lcQuery(query, { username: student.lc, limit: 100 });
      const list = data?.data?.recentAcSubmissionList || [];
      const completions = {};
      problems.forEach((p) => {
        const slug = p.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const match = list.find((s) => s.titleSlug === slug);
        if (match) {
          completions[`${student.id}_${p.id}`] = {
            time: new Date(parseInt(match.timestamp) * 1000).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
            lang: match.lang,
            source: "leetcode",
          };
        }
      });
      return { studentId: student.id, completions };
    })
  );

  const allCompletions = {};
  results.forEach((r) => {
    if (r.status === "fulfilled") Object.assign(allCompletions, r.value.completions);
  });

  res.json({ completions: allCompletions });
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok", port: PORT }));

app.listen(PORT, () => {
  console.log(`\n✅ CodeTrack server → http://localhost:${PORT}`);
  console.log("  GET  /profile/:username");
  console.log("  POST /check-problem");
  console.log("  POST /bulk-check");
  console.log("  POST /notify");
  console.log("  POST /test-email\n");
  console.log("⚠  Edit EMAIL_CONFIG in server.js or set env vars before using email features.\n");
});
