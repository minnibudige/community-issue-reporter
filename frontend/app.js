const API = "/api/reports";
const $ = (id) => document.getElementById(id);
const state = { reports: [], noticeTimer: null };

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function formatDate(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, {year:"numeric", month:"short", day:"numeric"});
}
function showNotice(message, type = "success") {
  const notice = $("notice");
  notice.textContent = message;
  notice.className = `notice ${type}`;
  notice.hidden = false;
  clearTimeout(state.noticeTimer);
  state.noticeTimer = setTimeout(() => { notice.hidden = true; }, 4500);
}
async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  let body;
  try { body = await response.json(); } catch { body = {}; }
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}
async function loadReports() {
  $("reportsGrid").innerHTML = '<div class="loading-card">Loading community reports…</div>';
  try {
    const data = await request(API);
    state.reports = data.reports || [];
    renderReports();
    $("totalCount").textContent = data.stats?.total ?? state.reports.length;
    $("openCount").textContent = data.stats?.open ?? state.reports.filter(r => r.status !== "resolved").length;
    $("resolvedCount").textContent = data.stats?.resolved ?? state.reports.filter(r => r.status === "resolved").length;
  } catch (error) {
    $("reportsGrid").innerHTML = `<div class="empty-state"><strong>Could not load reports</strong>${escapeHTML(error.message)}<br><br>Check that the backend is running and Supabase is configured.</div>`;
    showNotice(error.message, "error");
  }
}
function renderReports() {
  const search = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const priority = $("priorityFilter").value;
  const list = state.reports.filter(r => {
    const searchable = `${r.title} ${r.location} ${r.description} ${r.category}`.toLowerCase();
    return (!search || searchable.includes(search)) && (!status || r.status === status) && (!priority || r.priority === priority);
  });
  if (!list.length) {
    $("reportsGrid").innerHTML = `<div class="empty-state"><strong>${state.reports.length ? "No matching reports" : "Be the first to report an issue"}</strong>${state.reports.length ? "Try changing your search or filters." : "Share a local problem so your community can track it."}</div>`;
    return;
  }
  $("reportsGrid").innerHTML = list.map(r => `
    <article class="report-card">
      <div class="card-top"><span class="category-tag">${escapeHTML(r.category)}</span><span class="priority priority-${escapeHTML(r.priority)}">${escapeHTML(r.priority)} priority</span></div>
      <h3>${escapeHTML(r.title)}</h3>
      <p class="report-location"><span>⌖</span>${escapeHTML(r.location)}</p>
      <p class="report-description">${escapeHTML(r.description)}</p>
      <div class="card-bottom"><span class="status status-${escapeHTML(r.status)}">${escapeHTML(r.status.replace("_", " "))}</span><div class="card-actions"><button class="text-button" data-action="view" data-id="${escapeHTML(r.id)}">Details</button><button class="text-button" data-action="edit" data-id="${escapeHTML(r.id)}">Edit</button><button class="text-button danger" data-action="delete" data-id="${escapeHTML(r.id)}">Delete</button></div></div>
    </article>`).join("");
}
function openNewReport() {
  $("reportForm").reset(); $("editingId").value = ""; $("dialogTitle").textContent = "Report an issue"; $("submitBtn").textContent = "Submit report"; $("reportDialog").showModal();
}
function openEditReport(report) {
  $("reportForm").reset();
  $("editingId").value = report.id; $("titleInput").value = report.title; $("locationInput").value = report.location;
  $("categoryInput").value = report.category; $("priorityInput").value = report.priority; $("descriptionInput").value = report.description;
  $("dialogTitle").textContent = "Edit report"; $("submitBtn").textContent = "Save changes"; $("reportDialog").showModal();
}
function openDetails(report) {
  $("detailContent").innerHTML = `<p class="eyebrow">REPORT DETAILS</p><span class="category-tag">${escapeHTML(report.category)}</span><h2>${escapeHTML(report.title)}</h2><div class="detail-meta"><span class="status status-${escapeHTML(report.status)}">${escapeHTML(report.status.replace("_", " "))}</span><span class="priority priority-${escapeHTML(report.priority)}">${escapeHTML(report.priority)} priority</span></div><p><b>Location:</b> ${escapeHTML(report.location)}</p><p><b>Description:</b><br>${escapeHTML(report.description)}</p><p><b>Created:</b> ${escapeHTML(formatDate(report.created_at))}</p><p><b>Last updated:</b> ${escapeHTML(formatDate(report.updated_at))}</p><label for="detailStatus">Update status <select id="detailStatus"><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></label><div class="dialog-actions"><button id="saveStatusBtn" class="button button-primary" type="button">Update status</button></div>`;
  $("detailStatus").value = report.status;
  $("saveStatusBtn").addEventListener("click", async () => {
    try { await request(`${API}/${encodeURIComponent(report.id)}`, {method:"PATCH", body:JSON.stringify({status:$("detailStatus").value})}); $("detailDialog").close(); showNotice("Report status updated."); await loadReports(); }
    catch (e) { showNotice(e.message, "error"); }
  });
  $("detailDialog").showModal();
}
$("reportForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = $("editingId").value;
  const payload = { title:$("titleInput").value.trim(), location:$("locationInput").value.trim(), category:$("categoryInput").value, priority:$("priorityInput").value, description:$("descriptionInput").value.trim() };
  if (!payload.title || !payload.location || !payload.description) { showNotice("Please fill in all required fields.", "error"); return; }
  $("submitBtn").disabled = true; $("submitBtn").textContent = "Saving…";
  try {
    await request(id ? `${API}/${encodeURIComponent(id)}` : API, { method:id ? "PUT" : "POST", body:JSON.stringify(payload) });
    $("reportDialog").close(); showNotice(id ? "Report updated successfully." : "Report submitted successfully."); await loadReports();
  } catch (error) { showNotice(error.message, "error"); }
  finally { $("submitBtn").disabled = false; $("submitBtn").textContent = id ? "Save changes" : "Submit report"; }
});
$("reportsGrid").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]"); if (!button) return;
  const report = state.reports.find(r => String(r.id) === button.dataset.id); if (!report) return;
  if (button.dataset.action === "view") openDetails(report);
  if (button.dataset.action === "edit") openEditReport(report);
  if (button.dataset.action === "delete") {
    if (!confirm(`Delete "${report.title}"? This cannot be undone.`)) return;
    try { await request(`${API}/${encodeURIComponent(report.id)}`, {method:"DELETE"}); showNotice("Report deleted."); await loadReports(); }
    catch (error) { showNotice(error.message, "error"); }
  }
});
$("newReportBtn").addEventListener("click", openNewReport);
$("closeDialogBtn").addEventListener("click", () => $("reportDialog").close());
$("cancelBtn").addEventListener("click", () => $("reportDialog").close());
$("closeDetailBtn").addEventListener("click", () => $("detailDialog").close());
$("refreshBtn").addEventListener("click", loadReports);
["searchInput","statusFilter","priorityFilter"].forEach(id => $(id).addEventListener(id === "searchInput" ? "input" : "change", renderReports));
loadReports();
