const express = require("express");
const cors = require("cors");
const Database = require("./database");
const authRoutes = require("./authRoutes");
const { authMiddleware, writeMiddleware } = require("./auth");

const app = express();
app.use(cors());
app.use(express.json());

// Auth routes (no auth required for login)
app.use("/auth", authRoutes);

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

// Sync endpoint - Update target databases from source.db (OVERWRITE mode)
app.post("/sync/update-targets", authMiddleware, writeMiddleware, async (req, res) => {
  const { targetDb, targetTables } = req.body;

  if (!targetDb || !targetTables || !Array.isArray(targetTables)) {
    return res.status(400).json({ error: "targetDb dan targetTables harus diisi" });
  }

  let sourceDb, targetDatabase;
  try {
    sourceDb = new Database("source.db");
    targetDatabase = new Database(targetDb);

    // Get source data
    const sourceData = await sourceDb.getData("node");

    // Field mapping: source -> target
    // source: no, bms, info, type
    // target: NO, BMS, RANPUR, TYPE

    const results = {};

    for (const tableName of targetTables) {
      let deleted = 0;
      let inserted = 0;

      // Get target primary key
      const pkColumn = await targetDatabase.getPrimaryKey(tableName) || "NO";

      // OVERWRITE: Delete all existing data
      await targetDatabase.run(`DELETE FROM ${tableName}`);
      const deleteResult = await targetDatabase.get("SELECT changes() as c");
      deleted = deleteResult?.c || 0;

      // Insert all from source
      for (const sourceRow of sourceData) {
        await targetDatabase.run(
          `INSERT INTO ${tableName} (${pkColumn}, BMS, RANPUR, TYPE) VALUES (?, ?, ?, ?)`,
          [sourceRow.no, sourceRow.bms, sourceRow.info, sourceRow.type]
        );
        inserted++;
      }

      results[tableName] = { deleted, inserted };
    }

    res.json({ success: true, results, totalSource: sourceData.length });
  } catch (err) {
    console.error("Sync error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (sourceDb) sourceDb.close();
    if (targetDatabase) targetDatabase.close();
  }
});

// Sync source.db to posko.db with specific field mapping
app.post("/sync/update-posko", authMiddleware, writeMiddleware, async (req, res) => {
  let sourceDb;
  let poskoDb;

  try {
    const { targetTables } = req.body;

    // Read source data
    sourceDb = new Database("source.db");
    const sourceData = await sourceDb.getData("node");

    // Open posko database
    poskoDb = new Database("posko.db");

    const results = {};

    // Process each selected table
    for (const tableName of targetTables) {
      let updated = 0;
      let inserted = 0;
      let deleted = 0;

      switch (tableName) {
        case 'tblUnit':
          // Clear and insert
          await poskoDb.run("DELETE FROM tblUnit");
          deleted = (await poskoDb.get("SELECT changes() as c")).c || sourceData.length;

          for (const row of sourceData) {
            await poskoDb.run(
              `INSERT INTO tblUnit (MID, CallSign, Password, YonName, K, T, R, Flag, PictureID, DeadPID, HasCanon) 
               VALUES (?, ?, ?, '', 0, 0, 0, 0, 0, 0, 0)`,
              [row.bms, row.callsign || '', row.password || '']
            );
            inserted++;
          }
          break;

        case 'tblMID':
          await poskoDb.run("DELETE FROM tblMID");

          for (const row of sourceData) {
            await poskoDb.run(
              `INSERT INTO tblMID (MID, Address, VehicleID) VALUES (?, ?, ?)`,
              [row.bms, row.bms, row.info || '']
            );
            inserted++;
          }
          break;

        case 'tblNetIf':
          await poskoDb.run("DELETE FROM tblNetIf");

          for (const row of sourceData) {
            await poskoDb.run(
              `INSERT INTO tblNetIf (MID_NI, NI_Address, MID_GW, "GW_N I_ID", CommType, RemIP, RemPort, LocalPort, CommParam) 
               VALUES (?, ?, 0, 0, 1, '127.0.0.1', 17000, 17000, '')`,
              [row.bms, row.bms]
            );
            inserted++;
          }
          break;

        case 'tblBNet':
          await poskoDb.run("DELETE FROM tblBNet");

          let chnId = 1;
          for (const row of sourceData) {
            await poskoDb.run(
              `INSERT INTO tblBNet (ChnID, MID_NI, Channel, CommType, RemIP, RemPort, LocalPort, CommParam) 
               VALUES (?, ?, 0, 1, '192.168.56.255', 27000, 27000, '9600 8 N')`,
              [chnId++, row.bms]
            );
            inserted++;
          }
          break;

        case 'tblUnitChannel':
          await poskoDb.run("DELETE FROM tblUnitChannel");

          for (const row of sourceData) {
            await poskoDb.run(
              `INSERT INTO tblUnitChannel (MID, ChnID, StreamVal) VALUES (?, 1, ?)`,
              [row.bms, row.url || '']
            );
            inserted++;
          }
          break;

        case 'tblRegister':
          await poskoDb.run("DELETE FROM tblRegister");

          for (const row of sourceData) {
            await poskoDb.run(
              `INSERT INTO tblRegister (MID, Address) VALUES (?, ?)`,
              [row.bms, row.bms]
            );
            inserted++;
          }
          break;
      }

      results[tableName] = { deleted, inserted, updated };
    }

    res.json({ success: true, results, totalSource: sourceData.length });
  } catch (err) {
    console.error("Posko sync error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (sourceDb) sourceDb.close();
    if (poskoDb) poskoDb.close();
  }
});

// Initialize default admin user if not exists
async function initDefaultAdmin() {
  const { hashPassword } = require("./auth");
  let db;
  try {
    db = new Database("source.db");
    const admin = await db.get("SELECT id FROM users WHERE username = ?", ["admin"]);

    if (!admin) {
      const hashedPassword = await hashPassword("admin123");
      await db.run(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        ["admin", hashedPassword, "admin"]
      );
      console.log("✅ Default admin user created (username: admin, password: admin123)");
    }
  } catch (err) {
    console.error("Error creating default admin:", err);
  } finally {
    if (db) db.close();
  }
}

// Server listener
const PORT = 3001;
app.listen(PORT, async () => {
  await initDefaultAdmin();
  console.log(`✅ SQLite API running at http://localhost:${PORT}`);
});
