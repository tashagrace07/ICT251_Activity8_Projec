const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

async function createDatabase() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "data", "records.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const SQL = await initSqlJs({
    locateFile: file => require.resolve(`sql.js/dist/${file}`)
  });
  const database = fs.existsSync(dbPath)
    ? new SQL.Database(new Uint8Array(fs.readFileSync(dbPath)))
    : new SQL.Database();

  database.run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'In progress', 'Completed')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  function persist() {
    fs.writeFileSync(dbPath, Buffer.from(database.export()));
  }
  function all(sql, params = []) {
    const statement = database.prepare(sql);
    try {
      statement.bind(params);
      const rows = [];
      while (statement.step()) rows.push(statement.getAsObject());
      return rows;
    } finally {
      statement.free();
    }
  }
  function get(sql, params = []) { return all(sql, params)[0]; }
  function run(sql, params = []) {
    database.run(sql, params);
    const changes = database.getRowsModified();
    const lastInsertRowid = get("SELECT last_insert_rowid() AS id")?.id;
    persist();
    return { changes, lastInsertRowid };
  }
  return { all, get, run };
}
module.exports = createDatabase;
