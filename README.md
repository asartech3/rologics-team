# Rolo Team Dashboard

Professional **Performance Management Dashboard** for **Rolo Core** and **Rolo Edge** teams.
Replaces spreadsheets with live tracking, AI reports, approvals, targets and leaderboards.

**Domain:** rologicsinfolabs.com
**Subdomain (this app):** `team.rologicsinfolabs.com`

---

## ✨ Features

- **Role-based access control** — CEO, Manager, Team Lead, Assisting Lead, Member
- **Team isolation** — Rolo Core and Rolo Edge cannot see each other's data
- **Employee ID + Password login** with auto-generated strong passwords
- **Hourly entries** with pending → approved workflow (leaders approve/reject)
- **Project-based logging** — entries are logged against real projects, not generic metrics:
  Monthly Events Spot Collection, Monthly Events QA, Remote Team Process, Bulk Upload, Field Ops, Rate Audit, HPE (+ Other)
- **Team Lead can add new projects** (Hourly Entry → "Add new project") — Manager/CEO can add for any team or globally
- **Groq AI reports** (`openai/gpt-oss-120b`) — team, individual, monthly & comparative
- **Export** — Excel (CSV), PDF/Print, WhatsApp & Email sharing
- **Team Pulse** — weekly leaderboard, targets with progress rings
- **Attendance calendar** per member (profile page)
- **Notifications** — bell dropdown + browser alerts; full lock-screen push after HTTPS
- **PWA** — installable on phone home screens (Android & iPhone)
- **Dark mode** toggle in Settings
- **Mobile friendly** — every page works on phones

---

## 🔑 Account Details (for sharing with leads)

> **Keep this file private** — it contains live passwords.

| Employee ID   | Password  | Name                | Role          | Team       |
|---------------|-----------|---------------------|---------------|------------|
| RDO0000001    | CEO@2026  | CEO Rolo            | CEO           | Executive  |
| RDO0100816    | Rolo@2026 | GOKUL NATH S        | Manager       | All Teams  |
| RDO0250924    | Edge@2026 | DAYADEVI A S        | Team Lead     | Rolo Edge  |
| RDO0210225    | Edge@2026 | ANNIE MARY M        | Assisting Lead| Rolo Edge  |
| RDO0180526    | Edge@2026 | ABHIRA NAND         | Member        | Rolo Edge  |
| RDO0270225    | Edge@2026 | ABHISHEK A          | Member        | Rolo Edge  |
| RDO02207261   | Edge@2026 | ANUPAMA J           | Member        | Rolo Edge  |
| RDO0030624    | Core@2026 | ARYA DEVI R         | Team Lead     | Rolo Core  |
| RDO02411251   | Core@2026 | LEKSHMI SASIDHARAN  | Assisting Lead| Rolo Core  |
| RDO02411252   | Core@2026 | BIJOY J BIJU        | Member        | Rolo Core  |
| RDO02207262   | Core@2026 | PRAKRITHI S         | Member        | Rolo Core  |
| RDO0230726    | Core@2026 | SHIVALAKSHMI O      | Member        | Rolo Core  |
| RDO00306262   | Rolo@2026 | MAHESH M            | Member        | Unassigned |
| RDO00306261   | Rolo@2026 | MANU M              | Member        | Unassigned |

**Login page:** `https://team.rologicsinfolabs.com` (or `http://localhost:3000` while testing)

---

## 📄 Share Sheets (copy-paste into WhatsApp)

### → Send to DAYADEVI A S (Team Lead — Rolo Edge)

```
ROLO TEAM — LOGIN DETAILS (Rolo Edge)
Site: https://team.rologicsinfolabs.com

TEAM LEAD
  ID: RDO0250924
  Password: Edge@2026
  Name: DAYADEVI A S

ASSISTING LEAD
  ID: RDO0210225
  Password: Edge@2026
  Name: ANNIE MARY M

MEMBERS
  RDO0180526   Edge@2026   ABHIRA NAND
  RDO0270225   Edge@2026   ABHISHEK A
  RDO02207261  Edge@2026   ANUPAMA J

First visit → login. In phone browser use
menu → "Add to Home screen" to install the app.
Keep this message safe — it contains passwords.
```

### → Send to ARYA DEVI R (Team Lead — Rolo Core)

```
ROLO TEAM — LOGIN DETAILS (Rolo Core)
Site: https://team.rologicsinfolabs.com

TEAM LEAD
  ID: RDO0030624
  Password: Core@2026
  Name: ARYA DEVI R

ASSISTING LEAD
  ID: RDO02411251
  Password: Core@2026
  Name: LEKSHMI SASIDHARAN

MEMBERS
  RDO02411252  Core@2026   BIJOY J BIJU
  RDO02207262  Core@2026   PRAKRITHI S
  RDO0230726   Core@2026   SHIVALAKSHMI O

First visit → login. In phone browser use
menu → "Add to Home screen" to install the app.
Keep this message safe — it contains passwords.
```

### → Send to GOKUL NATH S (Manager — full overview)

```
ROLO TEAM — MANAGER ACCESS
Site: https://team.rologicsinfolabs.com

  ID: RDO0100816
  Password: Rolo@2026
  Name: GOKUL NATH S

You can see ALL employees from both teams,
manage users, reset passwords, assign targets
and generate AI reports.
```

---

## 👀 Who Sees What

| Role          | Team Pages        | Reports          | Manage Users | Remove Employees | Reset Passwords    |
|---------------|-------------------|------------------|--------------|------------------|--------------------|
| CEO           | All teams         | All teams        | ✔            | ✔                | All (except CEO/Manager) |
| Manager       | All teams         | All teams        | ✔            | ✔                | All (except CEO/Manager) |
| Team Lead     | Own team only     | Own team + own   | ✔ (own team) | ✖                | Own team only      |
| Assisting Lead| Own team (view)   | Own team + own   | ✖            | ✖                | ✖                  |
| Member        | Self only         | Own only         | ✖            | ✖                | ✖                  |

---

## 🚀 Running Locally

```bash
npm install
npm run dev     # http://localhost:3000
```

- Database: `db/data.json` (auto-created; endpoints read users / profiles / performance / reports / targets / notifications)
- Seed / reset structure: `node lib/seed.js`
- Clean test artefacts only: `node scripts/clean-test-data.js`
- Env file `.env.local`: `JWT_SECRET` + `GROQ_API_KEY`

**⚠️ Do NOT run `npm run build` while `npm run dev` is running** (corrupts `.next`). Stop dev first, build, then start.

---

## 📦 Deployment (Hostinger + Cloudflare)

1. Push this repo to GitHub.
2. On the Hostinger server (SSH): clone repo → `npm install` → `NODE_ENV=production npm run build` → run `npm start` (pm2 recommended: `pm2 start npm --name rolo-team -- start`).
3. Cloudflare DNS: add **A record** `team` → server IP (orange cloud), SSL mode Full.
4. Set env vars in `.env.local` on the server: `JWT_SECRET`, `GROQ_API_KEY`.
5. Once HTTPS is live, browsers will allow lock-screen push notifications — members enable in Settings.

---

*Rolo Team Dashboard v2.0 — Performance. Measured. Simplified.*
