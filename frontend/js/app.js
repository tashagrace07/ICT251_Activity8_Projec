
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

// Display messages
function showMessage(element, message = "", type = "") {
  element.textContent = message;
  element.className = `message ${type}`;
}

// Collect form information
function formData() {
  return {
    title: titleInput.value.trim(),
    category: categoryInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: statusInput.value
  };
}

// Reset form
function resetForm() {
  form.reset();
  editingId = null;
  formHeading.textContent = "Add a record";
  saveButton.textContent = "Add record";
  cancelButton.hidden = true;
}

// Safely create HTML text elements
function makeText(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;

  if (className) {
    element.className = className;
  }

  return element;
}

// Load and display records
function renderRecords() {
  const term = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const filtered = records.filter(record => {
    const matchesText = [
      record.title,
      record.category,
      record.description
    ].some(value =>
      String(value || "").toLowerCase().includes(term)
    );

    return matchesText &&
      (!selectedStatus || record.status === selectedStatus);
  });

  countElement.textContent = filtered.length;
  recordsElement.replaceChildren();

  if (!filtered.length) {
    recordsElement.append(
      makeText(
        "p",
        records.length
          ? "No records match your search/filter."
          : "No records yet. Add your first record above."
      )
    );
    return;
  }

  filtered.forEach(record => {
    const card = makeText("article", "", "record-card");
    const top = makeText("div", "", "record-top");
    const details = document.createElement("div");

    details.append(
      makeText("h3", `#${record.id} · ${record.title}`)
    );

    details.append(
      makeText("p", `Category: ${record.category}`)
    );

    details.append(
      makeText("p", record.description)
    );

    top.append(
      details,
      makeText("span", record.status, "tag")
    );

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

// Load records from the backend
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

// Add styling for the View and Delete windows
function addRecordModalStyles() {
  if (document.getElementById("record-modal-styles")) return;

  const style = document.createElement("style");
  style.id = "record-modal-styles";

  style.textContent = `
    .record-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, .72);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 99999;
      animation: modalFade .2s ease;
    }

    .record-modal {
      background: #ffffff;
      width: 100%;
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 30px;
      border-radius: 20px;
      box-shadow: 0 25px 70px rgba(0,0,0,.25);
      animation: modalSlide .25s ease;
    }

    .record-modal h2 {
      color: #1d4ed8;
      font-size: 25px;
      margin: 0 0 8px;
    }

    .record-modal p {
      color: #64748b;
      line-height: 1.7;
    }

    .record-modal-icon {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 16px;
    }

    .view-icon {
      background: #dbeafe;
      color: #2563eb;
    }

    .delete-icon {
      background: #fee2e2;
      color: #dc2626;
    }

    .record-detail {
      background: #f8fafc;
      padding: 14px;
      border-radius: 11px;
      margin-top: 12px;
      border-left: 4px solid #60a5fa;
    }

    .record-detail strong {
      display: block;
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .6px;
      margin-bottom: 6px;
    }

    .record-detail span {
      color: #172554;
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .record-status {
      display: inline-block;
      padding: 7px 13px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      background: #dcfce7;
      color: #15803d;
    }

    .record-modal-actions {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 25px;
    }

    .record-modal-actions button {
      border: none;
      border-radius: 9px;
      padding: 12px 19px;
      font-weight: 700;
      cursor: pointer;
      transition: .2s;
    }

    .record-modal-actions button:hover {
      transform: translateY(-2px);
      opacity: .88;
    }

    .modal-close {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .modal-delete {
      background: #dc2626;
      color: white;
    }

    @keyframes modalFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalSlide {
      from {
        opacity: 0;
        transform: translateY(15px) scale(.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (max-width: 480px) {
      .record-modal {
        padding: 23px 18px;
      }
    }
  `;

  document.head.appendChild(style);
}

// View an individual record in a colourful window
async function viewRecord(id) {
  try {
    const record = await recordService.get(id);

    addRecordModalStyles();

    const overlay = makeText(
      "div",
      "",
      "record-modal-overlay"
    );

    const modal = makeText(
      "div",
      "",
      "record-modal"
    );

    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "view-modal-title");

    const icon = makeText(
      "div",
      "▣",
      "record-modal-icon view-icon"
    );

    const heading = makeText(
      "h2",
      "Record Details"
    );

    heading.id = "view-modal-title";

    const subtitle = makeText(
      "p",
      `Viewing information for record #${record.id}`
    );

    function detail(label, value) {
      const box = makeText("div", "", "record-detail");

      box.append(
        makeText("strong", label),
        makeText("span", value || "Not provided")
      );

      return box;
    }

    const status = makeText(
      "span",
      record.status,
      "record-status"
    );

    const statusBox = makeText(
      "div",
      "",
      "record-detail"
    );

    statusBox.append(
      makeText("strong", "Status"),
      status
    );

    const actions = makeText(
      "div",
      "",
      "record-modal-actions"
    );

    const closeButton = makeText(
      "button",
      "Close",
      "modal-close"
    );

    closeButton.type = "button";
    actions.append(closeButton);

    modal.append(
      icon,
      heading,
      subtitle,
      detail("Title", record.title),
      detail("Category", record.category),
      detail("Description", record.description),
      statusBox,
      actions
    );

    overlay.append(modal);
    document.body.append(overlay);

    function close() {
      overlay.remove();
      document.removeEventListener("keydown", handleEscape);
    }

    function handleEscape(event) {
      if (event.key === "Escape") close();
    }

    closeButton.addEventListener("click", close);

    overlay.addEventListener("click", event => {
      if (event.target === overlay) close();
    });

    document.addEventListener("keydown", handleEscape);
    closeButton.focus();

  } catch (error) {
    showMessage(listMessage, error.message, "error");
  }
}

// Prepare a record for editing
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

  form.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// Custom colourful delete confirmation window
function confirmDelete(id) {
  addRecordModalStyles();

  return new Promise(resolve => {
    const overlay = makeText(
      "div",
      "",
      "record-modal-overlay"
    );

    const modal = makeText(
      "div",
      "",
      "record-modal"
    );

    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "delete-modal-title");

    const icon = makeText(
      "div",
      "!",
      "record-modal-icon delete-icon"
    );

    const heading = makeText(
      "h2",
      "Delete this record?"
    );

    heading.id = "delete-modal-title";

    const message = makeText(
      "p",
      `You are about to delete record #${id}. This action cannot be undone.`
    );

    const actions = makeText(
      "div",
      "",
      "record-modal-actions"
    );

    const cancelButton = makeText(
      "button",
      "Keep Record",
      "modal-close"
    );

    cancelButton.type = "button";

    const deleteButton = makeText(
      "button",
      "Yes, Delete",
      "modal-delete"
    );

    deleteButton.type = "button";

    actions.append(cancelButton, deleteButton);

    modal.append(
      icon,
      heading,
      message,
      actions
    );

    overlay.append(modal);
    document.body.append(overlay);

    function close(result) {
      overlay.remove();
      document.removeEventListener("keydown", handleEscape);
      resolve(result);
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        close(false);
      }
    }

    cancelButton.addEventListener("click", () => {
      close(false);
    });

    deleteButton.addEventListener("click", () => {
      close(true);
    });

    overlay.addEventListener("click", event => {
      if (event.target === overlay) {
        close(false);
      }
    });

    document.addEventListener("keydown", handleEscape);
    cancelButton.focus();
  });
}

// Delete a record using the backend API
async function deleteRecord(id) {
  const confirmed = await confirmDelete(id);

  if (!confirmed) return;

  try {
    await recordService.remove(id);

    showMessage(
      listMessage,
      "Record deleted successfully.",
      "success"
    );

    await loadRecords();

  } catch (error) {
    showMessage(listMessage, error.message, "error");
  }
}

// Add or update records
form.addEventListener("submit", async event => {
  event.preventDefault();

  const record = formData();

  if (!Object.values(record).every(Boolean)) {
    showMessage(
      formMessage,
      "Please complete all fields.",
      "error"
    );
    return;
  }

  saveButton.disabled = true;
  showMessage(formMessage, "Saving…");

  try {
    if (editingId === null) {
      await recordService.create(record);
    } else {
      await recordService.update(editingId, record);
    }

    resetForm();

    showMessage(
      formMessage,
      "Saved successfully.",
      "success"
    );

    await loadRecords();

  } catch (error) {
    showMessage(formMessage, error.message, "error");

  } finally {
    saveButton.disabled = false;
  }
});

// Cancel editing
cancelButton.addEventListener("click", () => {
  resetForm();

  showMessage(
    formMessage,
    "Edit cancelled. The saved record was not changed."
  );
});

// Search and filter
searchInput.addEventListener("input", renderRecords);
statusFilter.addEventListener("change", renderRecords);

// Refresh records
document
  .querySelector("#refresh-button")
  .addEventListener("click", loadRecords);

// API guide and health links
document.querySelector("#api-guide-link").href =
  `${API_BASE_URL}/api-guide`;

document.querySelector("#health-link").href =
  `${API_BASE_URL}/health`;

// Check backend health
async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const result = await response.json();

    connectionStatus.textContent =
      response.ok && result.database === "connected"
        ? "API connected"
        : "API problem";

  } catch {
    connectionStatus.textContent = "API unavailable";
  }
}

// Start application
checkHealth();
loadRecords();
