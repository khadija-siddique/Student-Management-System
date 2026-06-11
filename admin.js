/* ============================================================
   admin.js — Admin Panel JavaScript
   Student Management System · Web Technologies SP26
   All four HTTP methods: GET, POST, PUT, DELETE
   ============================================================ */

const API = 'http://localhost:3000/students';

let allStudents  = []; // full data including hidden
let editingId    = null; // null = add mode, number = edit mode
let deleteTarget = null; // id of student pending deletion

// ─── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchAllStudents();
  document.getElementById('m-date').value = new Date().toISOString().split('T')[0];

  // Delegated click handler — avoids inline onclick escaping bugs
  document.getElementById('adminBody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id     = String(btn.dataset.id);
    const action = btn.dataset.action;
    if (action === 'edit') {
      openEditModal(id);
    } else if (action === 'delete') {
      const student = allStudents.find(s => String(s.id) === id);
      promptDelete(id, student ? student.name : 'this student');
    }
  });
});

// ─── GET all students (including hidden) ─────────────────────
async function fetchAllStudents() {
  showAdminState('loading');

  try {
    const response = await fetch(API); // no ?visible filter — admin sees all
    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const data = await response.json();
    allStudents = data;
    renderAdminStats(data);
    applyAdminFilters();

  } catch (err) {
    showAdminState('error', err.message);
    showToast('Could not reach JSON Server. Is it running?', 'error');
  }
}

// ─── Render Admin Stats (3+ required) ────────────────────────
function renderAdminStats(students) {
  const total     = students.length;
  const active    = students.filter(s => s.status === 'active').length;
  const probation = students.filter(s => s.status === 'probation').length;
  const inactive  = students.filter(s => s.status === 'inactive').length;
  const hidden    = students.filter(s => !s.visible).length;
  const avgCGPA   = total
    ? (students.reduce((sum, s) => sum + (s.cgpa || 0), 0) / total).toFixed(2)
    : 0;
  const feePaid   = total
    ? Math.round((students.filter(s => s.feeStatus === 'paid').length / total) * 100)
    : 0;
  const topCGPA   = total
    ? Math.max(...students.map(s => s.cgpa || 0)).toFixed(2)
    : 0;

  document.getElementById('as-total').textContent    = total;
  document.getElementById('as-active').textContent   = active;
  document.getElementById('as-probation').textContent= probation;
  document.getElementById('as-inactive').textContent = inactive;
  document.getElementById('as-avgcgpa').textContent  = avgCGPA;
  document.getElementById('as-feepaid').textContent  = `${feePaid}%`;
  document.getElementById('as-hidden').textContent   = hidden;
  document.getElementById('as-topcgpa').textContent  = topCGPA;
}

// ─── Filter + Search ─────────────────────────────────────────
function applyAdminFilters() {
  const query  = document.getElementById('adminSearch').value.trim().toLowerCase();
  const dept   = document.getElementById('adminFilterDept').value;
  const status = document.getElementById('adminFilterStatus').value;
  const fee    = document.getElementById('adminFilterFee').value;

  const filtered = allStudents.filter(s => {
    const matchSearch = !query ||
      s.name.toLowerCase().includes(query) ||
      s.rollNo.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query);
    const matchDept   = !dept   || s.department === dept;
    const matchStatus = !status || s.status === status;
    const matchFee    = !fee    || s.feeStatus === fee;
    return matchSearch && matchDept && matchStatus && matchFee;
  });

  renderAdminTable(filtered);
  document.getElementById('adminCount').textContent =
    `${filtered.length} of ${allStudents.length} students`;
}

// ─── Render Admin Table ───────────────────────────────────────
function renderAdminTable(students) {
  const tbody     = document.getElementById('adminBody');
  const table     = document.getElementById('adminTable');
  const empty     = document.getElementById('adminEmpty');
  const stateEl   = document.getElementById('adminListState');

  stateEl.style.display = 'none';

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
    const visIcon   = s.visible
      ? '<span style="color:var(--success);" title="Visible">👁</span>'
      : '<span style="color:var(--text-light);" title="Hidden">🚫</span>';

    return `
    <tr id="row-${s.id}">
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
      <td style="text-align:center;">${visIcon}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-success" title="Edit" data-action="edit" data-id="${s.id}">
            <i class="fa fa-pen"></i>
          </button>
          <button class="btn btn-sm btn-danger" title="Delete" data-action="delete" data-id="${s.id}">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ─── MODAL: Open Add Mode ─────────────────────────────────────
function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add New Student';
  document.getElementById('modalSaveBtn').innerHTML = '<i class="fa fa-plus"></i> Add Student';
  clearModalForm();
  clearModalErrors();
  document.getElementById('studentModal').classList.add('open');
}

// ─── MODAL: Open Edit Mode (load existing data) ───────────────
function openEditModal(id) {
  const student = allStudents.find(s => String(s.id) === String(id));
  if (!student) return;

  editingId = student.id;
  document.getElementById('modalTitle').textContent = `Edit — ${student.name}`;
  document.getElementById('modalSaveBtn').innerHTML = '<i class="fa fa-floppy-disk"></i> Save Changes';

  // Populate form with existing data
  document.getElementById('m-name').value   = student.name      || '';
  document.getElementById('m-roll').value   = student.rollNo    || '';
  document.getElementById('m-email').value  = student.email     || '';
  document.getElementById('m-phone').value  = student.phone     || '';
  document.getElementById('m-dept').value   = student.department|| '';
  document.getElementById('m-sem').value    = student.semester  || '';
  document.getElementById('m-cgpa').value   = student.cgpa      ?? '';
  document.getElementById('m-status').value = student.status    || 'active';
  document.getElementById('m-fee').value    = student.feeStatus || 'paid';
  document.getElementById('m-gender').value = student.gender    || '';
  document.getElementById('m-date').value   = student.enrollmentDate || '';
  document.getElementById('m-visible').value= String(student.visible);
  document.getElementById('m-addr').value   = student.address   || '';

  clearModalErrors();
  document.getElementById('studentModal').classList.add('open');
}

function closeModal() {
  document.getElementById('studentModal').classList.remove('open');
  editingId = null;
}

// ─── SAVE: POST (add) or PUT (edit) ──────────────────────────
async function saveStudent() {
  if (!validateModalForm()) return;

  const payload = {
    name:           document.getElementById('m-name').value.trim(),
    rollNo:         document.getElementById('m-roll').value.trim().toUpperCase(),
    email:          document.getElementById('m-email').value.trim().toLowerCase(),
    phone:          document.getElementById('m-phone').value.trim(),
    department:     document.getElementById('m-dept').value,
    semester:       document.getElementById('m-sem').value,
    cgpa:           parseFloat(document.getElementById('m-cgpa').value) || 0,
    status:         document.getElementById('m-status').value,
    feeStatus:      document.getElementById('m-fee').value,
    gender:         document.getElementById('m-gender').value,
    enrollmentDate: document.getElementById('m-date').value,
    visible:        document.getElementById('m-visible').value === 'true',
    address:        document.getElementById('m-addr').value.trim(),
  };

  const saveBtn = document.getElementById('modalSaveBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving…';

  try {
    let response;

    if (editingId === null) {
      // ── POST: new student ──
      response = await fetch(API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
    } else {
      // ── PUT: full update of existing student ──
      response = await fetch(`${API}/${editingId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: editingId, ...payload })
      });
    }

    if (!response.ok) throw new Error(`Save failed: ${response.status}`);

    const saved = await response.json();

    if (editingId === null) {
      allStudents.push(saved);
      showToast(`${saved.name} added successfully!`, 'success');
    } else {
      const idx = allStudents.findIndex(s => String(s.id) === String(editingId));
      if (idx !== -1) allStudents[idx] = saved;
      showToast(`${saved.name} updated successfully!`, 'success');
    }

    renderAdminStats(allStudents);
    applyAdminFilters();
    closeModal();

  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = editingId
      ? '<i class="fa fa-floppy-disk"></i> Save Changes'
      : '<i class="fa fa-plus"></i> Add Student';
  }
}

// ─── DELETE: Prompt then confirm ─────────────────────────────
function promptDelete(id, name) {
  deleteTarget = id;
  document.getElementById('confirmMsg').textContent =
    `Are you sure you want to delete "${name}"? This action cannot be undone.`;
  document.getElementById('confirmModal').classList.add('open');
}

function closeConfirm() {
  document.getElementById('confirmModal').classList.remove('open');
  deleteTarget = null;
}

async function confirmDelete() {
  if (deleteTarget === null) return;

  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Deleting…';

  try {
    const response = await fetch(`${API}/${deleteTarget}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error(`Delete failed: ${response.status}`);

    const name = allStudents.find(s => String(s.id) === String(deleteTarget))?.name || 'Student';
    allStudents = allStudents.filter(s => String(s.id) !== String(deleteTarget));
    renderAdminStats(allStudents);
    applyAdminFilters();
    showToast(`${name} deleted successfully.`, 'success');
    closeConfirm();

  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-trash"></i> Delete';
  }
}

// ─── Modal Form Validation ────────────────────────────────────
function validateModalForm() {
  let valid = true;

  const fields = [
    { id: 'm-name',  err: 'merr-name',  check: v => v.trim().length >= 3 },
    { id: 'm-roll',  err: 'merr-roll',  check: v => /^[A-Z]{2,5}-\d{4,5}$/i.test(v.trim()) },
    { id: 'm-email', err: 'merr-email', check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    { id: 'm-phone', err: 'merr-phone', check: v => /^03\d{2}-\d{7}$/.test(v.trim()) },
    { id: 'm-dept',  err: 'merr-dept',  check: v => v !== '' },
    { id: 'm-sem',   err: 'merr-sem',   check: v => v !== '' },
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

function clearModalErrors() {
  ['m-name','m-roll','m-email','m-phone','m-dept','m-sem'].forEach(id => {
    document.getElementById(id)?.classList.remove('error');
  });
  ['merr-name','merr-roll','merr-email','merr-phone','merr-dept','merr-sem'].forEach(id => {
    document.getElementById(id)?.classList.remove('show');
  });
}

function clearModalForm() {
  ['m-name','m-roll','m-email','m-phone','m-addr'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('m-dept').value    = '';
  document.getElementById('m-sem').value     = '';
  document.getElementById('m-gender').value  = '';
  document.getElementById('m-cgpa').value    = '';
  document.getElementById('m-status').value  = 'active';
  document.getElementById('m-fee').value     = 'paid';
  document.getElementById('m-visible').value = 'true';
  document.getElementById('m-date').value    = new Date().toISOString().split('T')[0];
}

// ─── Admin State Helper ───────────────────────────────────────
function showAdminState(type, msg = '') {
  const el    = document.getElementById('adminListState');
  const table = document.getElementById('adminTable');
  const empty = document.getElementById('adminEmpty');

  table.style.display = 'none';
  empty.style.display = 'none';
  el.style.display    = 'block';

  if (type === 'loading') {
    el.innerHTML = `<div class="state-box"><div class="spinner"></div><p>Loading all students…</p></div>`;
  } else if (type === 'error') {
    el.innerHTML = `<div class="state-box">
      <div class="state-icon">⚠️</div>
      <p>Failed to load data</p>
      <small>${escHtml(msg)}</small>
      <button class="btn btn-outline" onclick="fetchAllStudents()" style="margin-top:.75rem;">
        <i class="fa fa-rotate-right"></i> Retry
      </button></div>`;
  }
}

// ─── Toast ────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast');
  const item      = document.createElement('div');
  item.className  = `toast-item ${type}`;
  const icons     = { success: '✅', error: '❌', info: 'ℹ️' };
  item.innerHTML  = `<span>${icons[type] || 'ℹ️'}</span> ${escHtml(msg)}`;
  container.appendChild(item);
  setTimeout(() => item.remove(), 3500);
}

// ─── Utilities ────────────────────────────────────────────────
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cap(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}