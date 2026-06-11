/* ============================================================
   app.js — User Panel JavaScript
   Student Management System · Web Technologies SP26
   ============================================================ */

const API = 'http://localhost:3000/students';

let allStudents = []; // local cache of visible students

// ─── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchStudents();
  // Set today as default enrollment date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('f-date').value = today;
});

// ─── FETCH all visible students (GET) ────────────────────────
async function fetchStudents() {
  showListState('loading');

  try {
    const response = await fetch(`${API}?visible=true`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const data = await response.json();
    allStudents = data;
    renderStats(data);
    applyFilters();
  } catch (err) {
    showListState('error', err.message);
    showToast('Could not connect to JSON Server. Is it running?', 'error');
  }
}

// ─── Render stats row ────────────────────────────────────────
function renderStats(students) {
  document.getElementById('st-total').textContent = students.length;

  const active = students.filter(s => s.status === 'active').length;
  document.getElementById('st-active').textContent = active;

  const avgCGPA = students.length
    ? (students.reduce((sum, s) => sum + (s.cgpa || 0), 0) / students.length).toFixed(2)
    : '—';
  document.getElementById('st-cgpa').textContent = avgCGPA;

  const depts = new Set(students.map(s => s.department)).size;
  document.getElementById('st-depts').textContent = depts;
}

// ─── Filter + Search ─────────────────────────────────────────
function applyFilters() {
  const query  = document.getElementById('searchInput').value.trim().toLowerCase();
  const dept   = document.getElementById('filterDept').value;
  const sem    = document.getElementById('filterSem').value;
  const status = document.getElementById('filterStatus').value;

  const filtered = allStudents.filter(s => {
    const matchSearch = !query ||
      s.name.toLowerCase().includes(query) ||
      s.rollNo.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query);
    const matchDept   = !dept   || s.department === dept;
    const matchSem    = !sem    || s.semester === sem;
    const matchStatus = !status || s.status === status;
    return matchSearch && matchDept && matchSem && matchStatus;
  });

  renderTable(filtered);
  document.getElementById('resultCount').textContent =
    `Showing ${filtered.length} of ${allStudents.length} students`;
}

// ─── Render Table ─────────────────────────────────────────────
function renderTable(students) {
  const tbody = document.getElementById('studentBody');
  const table = document.getElementById('studentTable');
  const empty = document.getElementById('emptyState');
  const listState = document.getElementById('listState');

  listState.style.display = 'none';

  if (students.length === 0) {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  table.style.display = 'table';

  tbody.innerHTML = students.map((s, i) => {
    const cgpaClass = s.cgpa >= 3.5 ? 'high' : s.cgpa < 2.5 ? 'low' : '';
    const cgpaPct   = Math.min((s.cgpa / 4) * 100, 100).toFixed(0);

    return `
    <tr>
      <td style="color:var(--text-muted);font-size:.8rem;">${i + 1}</td>
      <td>
        <div class="student-name">${escHtml(s.name)}</div>
        <div class="roll-no">${escHtml(s.rollNo)} · ${escHtml(s.email)}</div>
      </td>
      <td>${escHtml(s.department)}</td>
      <td>${escHtml(s.semester)}</td>
      <td>
        <div class="cgpa-wrap">
          <div class="cgpa-bar"><div class="cgpa-fill ${cgpaClass}" style="width:${cgpaPct}%"></div></div>
          <span class="cgpa-val">${s.cgpa ?? '—'}</span>
        </div>
      </td>
      <td><span class="badge badge-${s.status}">${cap(s.status)}</span></td>
      <td><span class="badge badge-${s.feeStatus}">${cap(s.feeStatus)}</span></td>
    </tr>`;
  }).join('');
}

// ─── Toggle Enroll Form ───────────────────────────────────────
function toggleForm() {
  const form = document.getElementById('enrollForm');
  const icon = document.getElementById('toggleIcon');
  const btn  = document.getElementById('toggleFormBtn');
  const open = form.style.display === 'none';
  form.style.display = open ? 'block' : 'none';
  icon.className = open ? 'fa fa-chevron-up' : 'fa fa-chevron-down';
  btn.innerHTML  = `<i class="${icon.className}"></i> ${open ? 'Hide Form' : 'Show Form'}`;
}

// ─── Inline Form Validation ───────────────────────────────────
function validateForm() {
  let valid = true;

  const fields = [
    { id: 'f-name',   err: 'err-name',  check: v => v.trim().length >= 3 },
    { id: 'f-roll',   err: 'err-roll',  check: v => /^[A-Z]{2,5}-\d{4,5}$/i.test(v.trim()) },
    { id: 'f-email',  err: 'err-email', check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    { id: 'f-phone',  err: 'err-phone', check: v => /^03\d{2}-\d{7}$/.test(v.trim()) },
    { id: 'f-dept',   err: 'err-dept',  check: v => v !== '' },
    { id: 'f-sem',    err: 'err-sem',   check: v => v !== '' },
  ];

  fields.forEach(({ id, err, check }) => {
    const input  = document.getElementById(id);
    const errEl  = document.getElementById(err);
    const passes = check(input.value);

    input.classList.toggle('error', !passes);
    errEl.classList.toggle('show', !passes);
    if (!passes) valid = false;
  });

  return valid;
}

// Clear error on input
['f-name','f-roll','f-email','f-phone','f-dept','f-sem'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => clearFieldError(id));
  if (el) el.addEventListener('change', () => clearFieldError(id));
});

function clearFieldError(id) {
  const mapping = {
    'f-name': 'err-name', 'f-roll': 'err-roll', 'f-email': 'err-email',
    'f-phone': 'err-phone', 'f-dept': 'err-dept', 'f-sem': 'err-sem'
  };
  const input = document.getElementById(id);
  const errEl = document.getElementById(mapping[id]);
  if (input)  input.classList.remove('error');
  if (errEl)  errEl.classList.remove('show');
}

// ─── Submit New Student (POST) ────────────────────────────────
async function submitEnroll() {
  if (!validateForm()) return;

  const newStudent = {
    name:           document.getElementById('f-name').value.trim(),
    rollNo:         document.getElementById('f-roll').value.trim().toUpperCase(),
    email:          document.getElementById('f-email').value.trim().toLowerCase(),
    phone:          document.getElementById('f-phone').value.trim(),
    department:     document.getElementById('f-dept').value,
    semester:       document.getElementById('f-sem').value,
    gender:         document.getElementById('f-gender').value,
    address:        document.getElementById('f-addr').value.trim(),
    enrollmentDate: document.getElementById('f-date').value,
    cgpa:           0,
    status:         'active',
    feeStatus:      'pending',
    visible:        true
  };

  const btn = document.querySelector('#enrollForm .btn-primary');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Enrolling…';

  try {
    const response = await fetch(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(newStudent)
    });

    if (!response.ok) throw new Error(`POST failed: ${response.status}`);

    const saved = await response.json();
    allStudents.push(saved);
    applyFilters();
    renderStats(allStudents);
    resetForm();
    toggleForm(); // close after success
    showToast(`${saved.name} enrolled successfully!`, 'success');

  } catch (err) {
    showToast('Enrollment failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-paper-plane"></i> Enroll Student';
  }
}

// ─── Reset Form ───────────────────────────────────────────────
function resetForm() {
  ['f-name','f-roll','f-email','f-phone','f-addr'].forEach(id => {
    document.getElementById(id).value = '';
  });
  ['f-dept','f-sem','f-gender'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  ['f-name','f-roll','f-email','f-phone','f-dept','f-sem'].forEach(clearFieldError);
}

// ─── List state helper ────────────────────────────────────────
function showListState(type, msg = '') {
  const el    = document.getElementById('listState');
  const table = document.getElementById('studentTable');
  const empty = document.getElementById('emptyState');

  table.style.display = 'none';
  empty.style.display = 'none';
  el.style.display    = 'block';

  if (type === 'loading') {
    el.innerHTML = `<div class="state-box">
      <div class="spinner"></div><p>Loading students…</p></div>`;
  } else if (type === 'error') {
    el.innerHTML = `<div class="state-box">
      <div class="state-icon">⚠️</div>
      <p>Failed to load data</p>
      <small>${escHtml(msg)}</small>
      <button class="btn btn-outline" onclick="fetchStudents()" style="margin-top:.75rem;">
        <i class="fa fa-rotate-right"></i> Retry
      </button></div>`;
  }
}

// ─── Toast ────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast');
  const item = document.createElement('div');
  item.className = `toast-item ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  item.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${escHtml(msg)}`;
  container.appendChild(item);
  setTimeout(() => item.remove(), 3500);
}

// ─── Utilities ────────────────────────────────────────────────
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cap(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
