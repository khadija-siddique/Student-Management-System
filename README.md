# UniTrack — Student Management System
**Name:** [Khadija Siddique]  
**Roll Number:** [F24BDOCS1M01064]  
**Course:** Web Technologies SP26 · BSCS 4th Semester  
**Sections:** 2M

---

## 📋 Project Description

UniTrack is a full-featured Student Management System built with plain HTML, CSS, and JavaScript using JSON Server as a mock REST API backend. It allows staff to enroll, view, edit, and delete student records through a clean, responsive interface.

---

## 🛠️ Technology Stack

| Layer      | Technology                         |
|------------|-------------------------------------|
| Markup     | HTML5 (semantic: nav, main, section, form) |
| Styling    | Custom CSS (CSS Variables, Flexbox, Grid) |
| JavaScript | Plain JS — async/await, fetch API   |
| Backend    | JSON Server (mock REST API)         |
| Data       | JSON (db.json)                      |

---

## 🚀 How to Install & Run

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (comes with Node.js)

### Step 1 — Install JSON Server globally
```bash
npm install -g json-server
```

### Step 2 — Navigate to the project folder
```bash
cd student-management-system
```

### Step 3 — Start JSON Server
```bash
npx json-server --watch db.json
```

You should see:
```
Resources
  http://localhost:3000/students

Home
  http://localhost:3000
```

### Step 4 — Open the app
Open `index.html` in your browser (double-click or use Live Server in VS Code).

> ⚠️ JSON Server must be running before you open the HTML files.

---

## 📁 File Structure

```
student-management-system/
│
├── index.html      ← User panel: browse & enroll students
├── admin.html      ← Admin panel: full CRUD + stats
├── style.css       ← All styling (CSS Variables + custom)
├── app.js          ← User panel JavaScript
├── admin.js        ← Admin panel JavaScript
├── db.json         ← JSON Server data file (source of truth)
└── README.md       ← This file
```

---

## ✅ Features

### User Panel (index.html)
- 📊 **Live stats** — total students, active count, avg CGPA, departments
- 🔍 **Multi-filter** — search by name/roll/email + filter by department, semester, status
- ➕ **Enroll form** — 9 input fields with inline validation (no alert() boxes)
  - Validates: name (≥3 chars), roll no format, email format, phone format (03XX-XXXXXXX), department, semester
- ⏳ **Loading state** — spinner while fetching
- ❌ **Error state** — clear error message if JSON Server is offline, with Retry button
- 🔄 **Auto-refresh** — list updates immediately after successful enrollment

### Admin Panel (admin.html)
- 👁️ **Sees all students** including hidden ones (users only see `visible: true`)
- 📈 **8 summary statistics**: total, active, probation, inactive, avg CGPA, fee paid %, hidden students, highest CGPA
- ✏️ **Edit student** — loads full data into modal form, saves with PUT
- 🗑️ **Delete student** — confirmation dialog before DELETE
- ➕ **Add student** — full form with POST
- 🔍 **Advanced filters** — search, department, status, fee status

### HTTP Methods Used
| Method | Where | Purpose |
|--------|-------|---------|
| GET    | Both panels | Fetch student list |
| POST   | User enroll form + Admin add | Create new student |
| PUT    | Admin edit modal | Update entire student record |
| DELETE | Admin delete button | Remove student record |

---

## 📸 Screenshots

![alt text](<Screenshot (3).png>)
![alt text](<Screenshot (4).png>)
![alt text](<Screenshot (5).png>)
![alt text](<Screenshot (6).png>)

---

## 🧪 Code Standards
- All fetch calls wrapped in `async/await` with `try/catch`
- `response.ok` checked before parsing JSON
- No hardcoded arrays — all data fetched from JSON Server
- Helper functions: `renderTable()`, `renderAdminStats()`, `applyFilters()`, `showToast()`, `escHtml()`
- No `console.log` left in production code
- Semantic HTML throughout

---

