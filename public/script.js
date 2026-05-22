const API = '/api';
let itemTypes = [];
let itemsMap  = {};

// ── Bootstrap ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadItemTypes();
  addItemRow();
  await loadItems();

  document.getElementById('addItemBtn').addEventListener('click', addItemRow);
  document.getElementById('purchaseForm').addEventListener('submit', handleSubmit);
  document.getElementById('refreshBtn').addEventListener('click', loadItems);
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelEdit').addEventListener('click', closeModal);
  document.getElementById('editForm').addEventListener('submit', handleEdit);
  document.getElementById('editModal').addEventListener('click', e => {
    if (e.target.id === 'editModal') closeModal();
  });
});

// ── Item Types ────────────────────────────────────────────────────
async function loadItemTypes() {
  try {
    const res  = await fetch(`${API}/item-types`);
    const data = await res.json();
    if (data.success) {
      itemTypes = data.data;
      populateEditTypeSelect();
    }
  } catch {
    showToast('Failed to load item types', 'error');
  }
}

function populateEditTypeSelect() {
  const select  = document.getElementById('editType');
  select.innerHTML =
    '<option value="">Select type...</option>' +
    itemTypes.map(t => `<option value="${t.id}">${esc(t.type_name)}</option>`).join('');
}

function typeOptionsHtml() {
  return itemTypes
    .map(t => `<option value="${t.id}">${esc(t.type_name)}</option>`)
    .join('');
}

// ── Dynamic Item Rows ─────────────────────────────────────────────
function addItemRow() {
  const container = document.getElementById('itemRows');
  const div = document.createElement('div');
  div.className = 'item-row';

  div.innerHTML = `
    <div class="row-header">
      <span class="row-label">Item</span>
      <button type="button" class="remove-row-btn" title="Remove this item">&#x2715;</button>
    </div>
    <div class="row-fields">
      <div class="form-group">
        <label>Item Name <span class="req">*</span></label>
        <input type="text" name="name" required placeholder="e.g. Samsung TV" class="form-control">
      </div>
      <div class="form-group">
        <label>Item Type <span class="req">*</span></label>
        <select name="item_type_id" required class="form-control">
          <option value="">Select type...</option>
          ${typeOptionsHtml()}
        </select>
      </div>
      <div class="form-group">
        <label>Purchase Date <span class="req">*</span></label>
        <input type="date" name="purchase_date" required class="form-control">
      </div>
      <div class="form-group">
        <label class="checkbox-wrap">
          <input type="checkbox" name="stock_available">
          <span class="checkbox-label">Stock Available</span>
        </label>
      </div>
    </div>
  `;

  div.querySelector('.remove-row-btn').addEventListener('click', () => {
    if (container.querySelectorAll('.item-row').length > 1) {
      div.remove();
      reindexRows();
    } else {
      showToast('At least one item row is required', 'error');
    }
  });

  container.appendChild(div);
  reindexRows();
}

function reindexRows() {
  document.querySelectorAll('.item-row .row-label').forEach((el, i) => {
    el.textContent = `Item ${i + 1}`;
  });
}

// ── Form Submit ───────────────────────────────────────────────────
async function handleSubmit(e) {
  e.preventDefault();

  const rows  = document.querySelectorAll('.item-row');
  const items = Array.from(rows).map(row => ({
    name:            row.querySelector('[name="name"]').value.trim(),
    item_type_id:    parseInt(row.querySelector('[name="item_type_id"]').value),
    purchase_date:   row.querySelector('[name="purchase_date"]').value,
    stock_available: row.querySelector('[name="stock_available"]').checked
  }));

  const btn = document.getElementById('submitBtn');
  btn.disabled    = true;
  btn.textContent = 'Submitting…';

  try {
    const res  = await fetch(`${API}/items`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ items })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      document.getElementById('itemRows').innerHTML = '';
      addItemRow();
      await loadItems();
    } else {
      const msg = data.errors ? data.errors.join(' | ') : data.message;
      showToast(msg, 'error');
    }
  } catch {
    showToast('Network error. Please try again.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Submit Purchase';
  }
}

// ── Load & Render Table ───────────────────────────────────────────
async function loadItems() {
  const tbody = document.getElementById('itemsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" class="state-cell">Loading…</td></tr>';

  try {
    const res  = await fetch(`${API}/items`);
    const data = await res.json();

    if (data.success) {
      itemsMap = {};
      data.data.forEach(item => { itemsMap[item.id] = item; });
      renderTable(data.data);
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="state-cell error">Failed to load items.</td></tr>';
    }
  } catch {
    tbody.innerHTML = '<tr><td colspan="6" class="state-cell error">Network error. Could not load items.</td></tr>';
  }
}

function renderTable(items) {
  const tbody = document.getElementById('itemsTableBody');

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="state-cell">No items found. Add your first purchase above.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="item-name">${esc(item.name)}</td>
      <td><span class="badge badge-type">${esc(item.type_name)}</span></td>
      <td>${fmtDate(item.purchase_date)}</td>
      <td>
        <span class="badge ${item.stock_available ? 'badge-success' : 'badge-danger'}">
          ${item.stock_available ? 'In Stock' : 'Out of Stock'}
        </span>
      </td>
      <td class="actions">
        <button class="btn btn-edit btn-sm" onclick="openEditModal(${item.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteItem(${item.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

// ── Edit Modal ────────────────────────────────────────────────────
function openEditModal(id) {
  const item = itemsMap[id];
  if (!item) return;

  document.getElementById('editId').value      = item.id;
  document.getElementById('editName').value    = item.name;
  document.getElementById('editType').value    = String(item.item_type_id);
  document.getElementById('editDate').value    = item.purchase_date;
  document.getElementById('editStock').checked = Boolean(item.stock_available);

  document.getElementById('editModal').classList.remove('hidden');
  document.getElementById('editName').focus();
}

function closeModal() {
  document.getElementById('editModal').classList.add('hidden');
}

async function handleEdit(e) {
  e.preventDefault();

  const id      = document.getElementById('editId').value;
  const payload = {
    name:            document.getElementById('editName').value.trim(),
    item_type_id:    parseInt(document.getElementById('editType').value),
    purchase_date:   document.getElementById('editDate').value,
    stock_available: document.getElementById('editStock').checked
  };

  const btn = e.submitter || e.target.querySelector('[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    const res  = await fetch(`${API}/items/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      closeModal();
      await loadItems();
    } else {
      showToast(data.message, 'error');
    }
  } catch {
    showToast('Network error. Could not update item.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Save Changes'; }
  }
}

// ── Delete ────────────────────────────────────────────────────────
async function deleteItem(id) {
  const item = itemsMap[id];
  if (!confirm(`Delete "${item?.name || 'this item'}"? This cannot be undone.`)) return;

  try {
    const res  = await fetch(`${API}/items/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      await loadItems();
    } else {
      showToast(data.message, 'error');
    }
  } catch {
    showToast('Network error. Could not delete item.', 'error');
  }
}

// ── Helpers ───────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const el    = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
}
