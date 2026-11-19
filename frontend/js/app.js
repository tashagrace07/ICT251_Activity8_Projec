import { API_BASE_URL } from "./config.js";
import { recordService } from "./data.js";

const form = document.querySelector("#record-form");
const titleInput = document.querySelector("#title");
const categoryInput = document.querySelector("#category");
const descriptionInput = document.querySelector("#description");
const statusInput = document.querySelector("#status");
const saveButton = document.querySelector("#save-button");
const cancelButton = document.querySelector("#cancel-button");
const formHeading = document.querySelector("#form-heading");
const formMessage = document.querySelector("#form-message");
const listMessage = document.querySelector("#list-message");
const recordsElement = document.querySelector("#records");
const countElement = document.querySelector("#record-count");
const searchInput = document.querySelector("#search");
const statusFilter = document.querySelector("#status-filter");
const connectionStatus = document.querySelector("#connection-status");

let records = [];
let editingId = null;

function showMessage(element, message = "", type = "") {
  element.textContent = message;
  element.className = `message ${type}`;
}
function formData() {
  return {
    title: titleInput.value.trim(),
    category: categoryInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: statusInput.value
  };
}
function resetForm() {
  form.reset();
  editingId = null;
  formHeading.textContent = "Add a record";
  saveButton.textContent = "Add record";
  cancelButton.hidden = true;
}
function makeText(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}
function renderRecords() {
  const term = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;
  const filtered = records.filter(record => {
    const matchesText = [record.title, record.category, record.description].some(value => value.toLowerCase().includes(term));
    return matchesText && (!selectedStatus || record.status === selectedStatus);
  });
  countElement.textContent = filtered.length;
  recordsElement.replaceChildren();
  if (!filtered.length) {
    recordsElement.append(makeText("p", records.length ? "No records match your search/filter." : "No records yet. Add your first record above."));
    return;
  }
  filtered.forEach(record => {
    const card = makeText("article", "", "record-card");
    const top = makeText("div", "", "record-top");
    const details = document.createElement("div");
    details.append(makeText("h3", `#${record.id} · ${record.title}`));
    details.append(makeText("p", `Category: ${record.category}`));
    details.append(makeText("p", record.description));
    top.append(details, makeText("span", record.status, "tag"));
    const actions = makeText("div", "", "card-actions");
    const view = makeText("button", "View");
    view.type = "button";
    view.addEventListener("click", () => viewRecord(record.id));
    const edit = makeText("button", "Edit", "secondary");
    edit.type = "button";
    edit.addEventListener("click", () => beginEdit(record.id));
    const remove = makeText("button", "Delete", "delete");
    remove.type = "button";
    remove.addEventListener("click", () => deleteRecord(record.id));
    actions.append(view, edit, remove);
    card.append(top, actions);
    recordsElement.append(card);
  });
}
async function loadRecords() {
  showMessage(listMessage, "Loading records…");
  try {
    records = await recordService.list();
    renderRecords();
    showMessage(listMessage, "");
    connectionStatus.textContent = "API connected";
  } catch (error) {
    records = [];
    renderRecords();
    showMessage(listMessage, error.message, "error");
    connectionStatus.textContent = "API unavailable";
  }
}
async function viewRecord(id) {
  try {
    const record = await recordService.get(id);
    alert(`Record #${record.id}\nTitle: ${record.title}\nCategory: ${record.category}\nDescription: ${record.description}\nStatus: ${record.status}`);
  } catch (error) {
    showMessage(listMessage, error.message, "error");
  }
}
function beginEdit(id) {
  const record = records.find(item => item.id === id);
  if (!record) return;
  editingId = id;
  titleInput.value = record.title;
  categoryInput.value = record.category;
  descriptionInput.value = record.description;
  statusInput.value = record.status;
  formHeading.textContent = `Edit record #${id}`;
  saveButton.textContent = "Save changes";
  cancelButton.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}
async function deleteRecord(id) {
  if (!confirm(`Are you sure you want to delete record #${id}?`)) return;
  try {
    await recordService.remove(id);
    showMessage(listMessage, "Record deleted successfully.", "success");
    await loadRecords();
  } catch (error) {
    showMessage(listMessage, error.message, "error");
  }
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const record = formData();
  if (!Object.values(record).every(Boolean)) {
    showMessage(formMessage, "Please complete all fields.", "error");
    return;
  }
  saveButton.disabled = true;
  showMessage(formMessage, "Saving…");
  try {
    if (editingId === null) await recordService.create(record);
    else await recordService.update(editingId, record);
    resetForm();
    showMessage(formMessage, "Saved successfully.", "success");
    await loadRecords();
  } catch (error) {
    showMessage(formMessage, error.message, "error");
  } finally {
    saveButton.disabled = false;
  }
});
cancelButton.addEventListener("click", () => {
  resetForm();
  showMessage(formMessage, "Edit cancelled. The saved record was not changed.");
});
searchInput.addEventListener("input", renderRecords);
statusFilter.addEventListener("change", renderRecords);
document.querySelector("#refresh-button").addEventListener("click", loadRecords);

document.querySelector("#api-guide-link").href = `${API_BASE_URL}/api-guide`;
document.querySelector("#health-link").href = `${API_BASE_URL}/health`;

async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const result = await response.json();
    connectionStatus.textContent = response.ok && result.database === "connected" ? "API connected" : "API problem";
  } catch {
    connectionStatus.textContent = "API unavailable";
  }
}
checkHealth();
loadRecords();
