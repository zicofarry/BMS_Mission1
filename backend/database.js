const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class Database {
  constructor(dbName) {
    // Database diambil dari folder ../data/
    const dbPath = path.resolve(__dirname, "../data", dbName);
    this.db = new sqlite3.Database(dbPath);
  }

  // Ambil daftar tabel
  getTables() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(r => r.name));
      });
    });
  }

  // Ambil semua data
  getData(table) {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM ${table}`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Ambil jumlah data
  getCount(table) {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT COUNT(*) as total FROM ${table}`, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Ambil data per halaman (Pagination)
  getDataPage(table, no, length) {
    return new Promise((resolve, reject) => {
      const offset = (no - 1) * length;
      this.db.all(`SELECT * FROM ${table} LIMIT ? OFFSET ?`, [length, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Ambil Primary Key
  getPrimaryKey(table) {
    return new Promise((resolve, reject) => {
      this.db.all(`PRAGMA table_info(${table})`, (err, rows) => {
        if (err) reject(err);
        else {
          const pk = rows.find(r => r.pk === 1);
          resolve(pk ? pk.name : null);
        }
      });
    });
  }

  // Get table schema (column types)
  getSchema(table) {
    return new Promise((resolve, reject) => {
      this.db.all(`PRAGMA table_info(${table})`, (err, rows) => {
        if (err) reject(err);
        else {
          resolve(rows.map(r => ({
            name: r.name,
            type: r.type,
            pk: r.pk === 1,
            notNull: r.notnull === 1,
            defaultValue: r.dflt_value
          })));
        }
      });
    });
  }

  // Fungsi get generic (single row)
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Fungsi all generic (multiple rows)
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Fungsi run (untuk UPDATE/INSERT/DELETE)
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  // Fungsi Insert otomatis
  insert(table, data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => "?").join(",");
    const values = Object.values(data);
    return this.run(`INSERT INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`, values);
  }

  // Fungsi Update otomatis
  async update(table, id, data) {
    // Get primary key name first
    const pk = await this.getPrimaryKey(table);
    const pkColumn = pk || 'NO';
    const keys = Object.keys(data).filter(k => k.toUpperCase() !== pkColumn.toUpperCase());
    const fields = keys.map(k => `${k}=?`).join(",");
    const values = keys.map(k => data[k]);
    return this.run(`UPDATE ${table} SET ${fields} WHERE ${pkColumn} = ?`, [...values, id]);
  }

  // Fungsi Delete
  async delete(table, id) {
    // Get primary key name first
    const pk = await this.getPrimaryKey(table);
    const pkColumn = pk || 'NO';
    return this.run(`DELETE FROM ${table} WHERE ${pkColumn} = ?`, [id]);
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;
