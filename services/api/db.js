// IBS Desk — API de Chamados
// Storage em arquivo JSON (simples e sem dependencias nativas).
// Em producao seria substituido por PostgreSQL (ver dw/dw_schema.sql).

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function load() {
  if (!fs.existsSync(DB_FILE)) {
    return { nextId: 1, tickets: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function save(db) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

module.exports = { load, save, DB_FILE };
