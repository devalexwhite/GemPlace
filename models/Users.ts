import { Database } from "../lib/Database";

export class Users {
  constructor(database: Database) {
    database.runAsync(
      "CREATE TABLE IF NOT EXISTS users (fingerprint TEXT PRIMARY KEY, lastActionDate TEXT)"
    );
  }
}
