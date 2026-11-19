const express = require("express");
const cors = require("cors");
const createDatabase = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://127.0.0.1:5500,http://localhost:5500")
  .split(",").map(origin => origin.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("This website origin is not allowed by the API CORS settings."));
  }
}));
app.use(express.json());

const validStatuses = ["Pending", "In progress", "Completed"];
function validateRecord(body) {
  const { title, category, description, status } = body || {};
  if (![title, category, description, status].every(v => typeof v === "string" && v.trim()))
    return "Title, category, description and status are required.";
  if (!validStatuses.includes(status)) return "Status must be Pending, In progress or Completed.";
  return null;
}
function cleanRecord(body) {
  return { title: body.title.trim(), category: body.category.trim(),
    description: body.description.trim(), status: body.status };
}

async function start() {
  const db = await createDatabase();

  app.get("/", (_req, res) => res.json({ message: "ICT251 Activity 8 Records API", health: "/health", guide: "/api-guide" }));
  app.get("/health", (_req, res) => {
    try { db.get("SELECT 1 AS ok"); res.json({ status: "ok", database: "connected" }); }
    catch (error) { res.status(500).json({ status: "error", database: "unavailable", message: error.message }); }
  });
  app.get("/api-guide", (_req, res) => res.type("text").send(
`ICT251 Records API

GET    /api/records       Get all records
GET    /api/records/:id   Get one record
POST   /api/records       Create a record
PUT    /api/records/:id   Update a record
DELETE /api/records/:id   Delete a record

POST and PUT JSON body:
{"title":"Example","category":"General","description":"Example description","status":"Pending"}

Allowed statuses: Pending, In progress, Completed.
Health check: GET /health`
  ));

  app.get("/api/records", (_req, res) =>
    res.json(db.all("SELECT id,title,category,description,status,created_at,updated_at FROM records ORDER BY id DESC")));

  app.get("/api/records/:id", (req, res) => {
    const record = db.get("SELECT id,title,category,description,status,created_at,updated_at FROM records WHERE id = ?", [Number(req.params.id)]);
    if (!record) return res.status(404).json({ message: "Record not found." });
    res.json(record);
  });

  app.post("/api/records", (req, res) => {
    const problem = validateRecord(req.body);
    if (problem) return res.status(400).json({ message: problem });
    const r = cleanRecord(req.body);
    const result = db.run("INSERT INTO records (title,category,description,status) VALUES (?,?,?,?)",
      [r.title, r.category, r.description, r.status]);
    res.status(201).json(db.get("SELECT id,title,category,description,status,created_at,updated_at FROM records WHERE id = ?", [result.lastInsertRowid]));
  });

  app.put("/api/records/:id", (req, res) => {
    const problem = validateRecord(req.body);
    if (problem) return res.status(400).json({ message: problem });
    const id = Number(req.params.id);
    if (!db.get("SELECT id FROM records WHERE id = ?", [id]))
      return res.status(404).json({ message: "Record not found." });
    const r = cleanRecord(req.body);
    db.run("UPDATE records SET title=?,category=?,description=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      [r.title, r.category, r.description, r.status, id]);
    res.json(db.get("SELECT id,title,category,description,status,created_at,updated_at FROM records WHERE id = ?", [id]));
  });

  app.delete("/api/records/:id", (req, res) => {
    const result = db.run("DELETE FROM records WHERE id = ?", [Number(req.params.id)]);
    if (!result.changes) return res.status(404).json({ message: "Record not found." });
    res.json({ message: "Record deleted successfully." });
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(error.message?.includes("origin") ? 403 : 500).json({ message: error.message || "Unexpected server error." });
  });
  app.listen(PORT, () => console.log(`Records API listening on port ${PORT}`));
}
start().catch(error => { console.error("Could not start the API:", error); process.exit(1); });
