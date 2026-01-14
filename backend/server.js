const express = require("express");
const cors = require("cors");
const Database = require("./database");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Log semua error global supaya tidak diam-diam exit
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

// Fungsi pembungkus aman
async function handleDbRequest(req, res, callback) {
  let db;
  try {
    db = new Database(req.params.dbname);
    const result = await callback(db);
    res.json(result);
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (db) db.close();
  }
}

// Routes
app.get("/tables/:dbname", (req, res) => {
  handleDbRequest(req, res, async (db) => db.getTables());
});

app.get("/data/:dbname/:table", (req, res) => {
  handleDbRequest(req, res, async (db) => db.getData(req.params.table));
});

app.get("/count/:dbname/:table", (req, res) => {
  handleDbRequest(req, res, async (db) => db.getCount(req.params.table));
});

app.get("/dataPage/:dbname/:table/:no/:length", (req, res) => {
  handleDbRequest(req, res, async (db) => db.getDataPage(req.params.table,req.params.no,req.params.length));
});
app.get("/primarykey/:dbname/:table", (req, res) => {
  handleDbRequest(req, res, async (db) => ({
    primaryKey: await db.getPrimaryKey(req.params.table),
  }));
});
app.get("/maxno/:dbname/:table", (req, res) => {
  handleDbRequest(req, res, async (db) => {
    const result = await db.get(`SELECT MAX(NO) AS max FROM ${req.params.table}`);
    return result;
  });
});
/*
app.post("/data/:dbname/:table", (req, res) => {
  handleDbRequest(req, res, async (db) => ({
    insertedId: await db.insert(req.params.table, req.body),
  }));
});
*/
app.post("/savePage/:dbname/:table", (req, res) => {
  handleDbRequest(req, res, async (db) => {
    const table = req.params.table;
    const rows = req.body;

    let inserted = 0;
    let updated = 0;
console.log(rows);
    for (const r of rows) {
      const pk = r.NO;
console.log("pk=",pk);
      const exist = await db.get(
        `SELECT 1 FROM ${table} WHERE NO = ?`,
        [pk]
      );

      if (exist) {
        // UPDATE
        const keys = Object.keys(r).filter(k => k !== "no");
        const fields = keys.map(k => `${k}=?`).join(",");
        const values = keys.map(k => r[k]);

        await db.run(
          `UPDATE ${table} SET ${fields} WHERE NO = ?`,
          [...values, pk]
        );
        updated++;
      } else {
        // INSERT
        const keys = Object.keys(r);
        const placeholders = keys.map(() => "?").join(",");
        await db.run(
          `INSERT INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`,
          keys.map(k => r[k])
        );
        inserted++;
      }
    }

    return { inserted, updated };
  });
});

app.post("/data/:dbname/:table", (req, res) => {
  handleDbRequest(req, res, async (db) => {
    const rows = req.body;

    if (!Array.isArray(rows)) {
      throw new Error("Body harus array row!");
    }

    let inserted = 0;

    await db.run("BEGIN TRANSACTION");

    for (const row of rows) {
      await db.insert(req.params.table, row);
      inserted++;
    }

    await db.run("COMMIT");

    return { inserted };
  });
});

app.put("/data/:dbname/:table/:id", (req, res) => {
  handleDbRequest(req, res, async (db) => ({
    updated: await db.update(req.params.table, req.params.id, req.body),
  }));
});

app.delete("/data/:dbname/:table/:id", (req, res) => {
  handleDbRequest(req, res, async (db) => ({
    deleted: await db.delete(req.params.table, req.params.id),
  }));
});

// Server listener
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ SQLite API running at http://localhost:${PORT}`);
});
