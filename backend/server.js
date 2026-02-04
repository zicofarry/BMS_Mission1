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
  handleDbRequest(req, res, async (db) => db.getDataPage(req.params.table, req.params.no, req.params.length));
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

// Get table schema (column types) for validation
app.get("/schema/:dbname/:table", (req, res) => {
  handleDbRequest(req, res, async (db) => {
    return await db.getSchema(req.params.table);
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

    // Get primary key column name and schema
    const pkColumn = await db.getPrimaryKey(table) || 'NO';
    const schema = await db.getSchema(table);
    console.log("Primary key column:", pkColumn);

    let inserted = 0;
    let updated = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];

      // Get pk value - try both cases
      const pk = r[pkColumn] ?? r[pkColumn.toLowerCase()] ?? r[pkColumn.toUpperCase()];
      console.log("pk=", pk, "row=", r);

      if (pk === undefined || pk === null) {
        errors.push({
          row: i + 1,
          column: pkColumn,
          message: `Baris ${i + 1}: Primary key (${pkColumn}) tidak boleh kosong`
        });
        continue;
      }

      // Validate data types before insert/update
      for (const col of schema) {
        const value = r[col.name];
        const type = (col.type || '').toUpperCase();

        if (type.includes('INT') || type.includes('INTEGER')) {
          // Strict integer check - must be only digits (with optional leading minus)
          if (value !== null && value !== '' && value !== undefined) {
            const strVal = String(value).trim();
            if (!/^-?\d+$/.test(strVal)) {
              errors.push({
                row: pk,
                column: col.name,
                value: value,
                message: `${pkColumn}=${pk}, Kolom "${col.name}": harus berupa angka bulat (nilai: "${value}")`
              });
            }
          }
        } else if (type.includes('REAL') || type.includes('FLOAT') || type.includes('DOUBLE')) {
          // Strict float check
          if (value !== null && value !== '' && value !== undefined) {
            const strVal = String(value).trim();
            if (!/^-?\d+(\.\d+)?$/.test(strVal)) {
              errors.push({
                row: pk,
                column: col.name,
                value: value,
                message: `${pkColumn}=${pk}, Kolom "${col.name}": harus berupa angka (nilai: "${value}")`
              });
            }
          }
        }
      }
    }

    // If there are validation errors, return them without saving
    if (errors.length > 0) {
      return {
        success: false,
        inserted: 0,
        updated: 0,
        errors: errors
      };
    }

    // No validation errors, proceed with save
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const pk = r[pkColumn] ?? r[pkColumn.toLowerCase()] ?? r[pkColumn.toUpperCase()];

      if (pk === undefined || pk === null) continue;

      try {
        const exist = await db.get(
          `SELECT 1 FROM ${table} WHERE ${pkColumn} = ?`,
          [pk]
        );

        if (exist) {
          // UPDATE
          const keys = Object.keys(r).filter(k => k.toUpperCase() !== pkColumn.toUpperCase());
          const fields = keys.map(k => `${k}=?`).join(",");
          const values = keys.map(k => r[k]);

          await db.run(
            `UPDATE ${table} SET ${fields} WHERE ${pkColumn} = ?`,
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
      } catch (err) {
        errors.push({
          row: pk,
          message: `${pkColumn}=${pk}: ${err.message}`
        });
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        inserted,
        updated,
        errors
      };
    }

    return { success: true, inserted, updated };
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
