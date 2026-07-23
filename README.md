# 📋 Work Tracker

A fast, fully offline **personal work-log and productivity webapp** — built with React + Vite. All data is stored in your browser's `localStorage` (no server needed). Deploy to **GitHub Pages** in one push.

🔗 **Live demo**: `https://<your-github-username>.github.io/work-tracker/`

---

## ✨ Features

| Feature | Details |
|---|---|
| 📅 **Calendar View** | Month & week view with colour-coded dots for entries, events, todos |
| 💼 **Work Entries** | Add / edit / delete daily work logs with title, category, hours, description, tags |
| 📌 **Events** | Track leaves, public holidays, sick days, WFH, travel, training, all-day meetings |
| ✅ **Todos** | Day / week / month scoped todos with priority, due dates, notes and completion toggle |
| 📊 **Dashboard** | 30-day summary: hours logged, category breakdown, recent activity |
| 📥 **Excel Export** | Download `.xlsx` with 4 sheets — presets: last 7 days / last week / last month / last 3 months / last 6 months / custom date range |
| 💾 **Offline / Local** | All data persists in `localStorage` — no login, no server |
| 🚀 **GitHub Pages** | One-command deploy with the included GitHub Actions workflow |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Run locally

```bash
git clone https://github.com/<your-username>/work-tracker.git
cd work-tracker
npm install
npm run dev
```

Open [http://localhost:5173/work-tracker/](http://localhost:5173/work-tracker/)

### Build for production

```bash
npm run build
# output goes to dist/
```

---

## 🌐 Deploy to GitHub Pages

### One-time setup

1. **Create** a public GitHub repository named `work-tracker` under your account.

2. **Push** this project:
   ```bash
   git init
   git add .
   git commit -m "feat: initial work-tracker"
   git remote add origin git@github.com:<your-username>/work-tracker.git
   git push -u origin main
   ```

3. **Enable GitHub Pages** in the repo settings:
   - Go to **Settings → Pages**
   - Set **Source** to `GitHub Actions`
   - Save

4. The workflow at `.github/workflows/deploy.yml` will run automatically on every push to `main` and deploy to:
   ```
   https://<your-username>.github.io/work-tracker/
   ```

### Manual trigger

```bash
gh workflow run deploy.yml
```

### If you rename the repo

Update the `base` in [`vite.config.js`](vite.config.js):
```js
base: '/your-repo-name/',
```

---

## 📁 Project Structure

```
work-tracker/
├── src/
│   ├── App.jsx                 # Root + AllTodosView + OverviewView
│   ├── App.css                 # All styles (single file)
│   ├── main.jsx
│   ├── store/
│   │   └── useStore.js         # localStorage-backed reactive store
│   ├── components/
│   │   ├── CalendarView.jsx    # Month/week calendar grid
│   │   ├── DayDetail.jsx       # Work entries, events, todos for a day
│   │   ├── WorkEntryModal.jsx  # Add/edit work entry form
│   │   ├── EventModal.jsx      # Add/edit event form
│   │   ├── TodoModal.jsx       # Add/edit todo form
│   │   └── ExportPanel.jsx     # Excel export panel
│   └── utils/
│       ├── dateUtils.js        # date-fns helpers + range presets
│       └── exportUtils.js      # XLSX export logic
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages CI/CD
├── vite.config.js
└── README.md
```

---

## 🔧 Tech Stack

| Library | Purpose |
|---|---|
| [React 19](https://react.dev) | UI framework |
| [Vite 6](https://vite.dev) | Build tool & dev server |
| [date-fns](https://date-fns.org) | Date manipulation |
| [xlsx (SheetJS)](https://sheetjs.com) | Excel export |
| [lucide-react](https://lucide.dev) | Icons |

---

## 📋 Data Model

All data lives in `localStorage` under these keys:

| Key | Contents |
|---|---|
| `wt_work_entries` | Array of work entries `{ id, date, title, description, category, hours, tags }` |
| `wt_events` | Array of events `{ id, date, title, type, description }` |
| `wt_todos` | Array of todos `{ id, scope, scopeValue, title, priority, dueDate, notes, completed }` |

**Todo scopes:**
- `day` — `scopeValue` is `yyyy-MM-dd` (e.g. `2025-06-23`)
- `week` — `scopeValue` is ISO week `yyyy-Www` (e.g. `2025-W26`)
- `month` — `scopeValue` is `yyyy-MM` (e.g. `2025-06`)

---

## 🗺️ Roadmap

- [ ] Dark mode
- [ ] Data import from Excel
- [ ] Recurring events
- [ ] Tags filter on calendar
- [ ] PWA / offline service worker

---

## 📄 License

MIT © 2025
