const DB_FILE = "./db.sql";

const sqlite3 = require("sqlite3").verbose();
const DB = new sqlite3.Database(DB_FILE);

const InitDB = (callback) => {
  DB.serialize(() => {
    DB.exec(
      "CREATE TABLE IF NOT EXISTS map (char TEXT NOT NULL, x INTEGER NOT NULL, y INTEGER NOT NULL)"
    );
    DB.exec(
      "CREATE TABLE IF NOT EXISTS users (fingerprint TEXT PRIMARY KEY, lastActionDate TEXT)"
    );

    callback();
  });
};

module.exports = {
  DB,
  InitDB,
};
