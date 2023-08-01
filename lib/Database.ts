import * as sqlite3 from "sqlite3";

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string = ":memory:") {
    this.db = new sqlite3.Database(dbPath);
    this.prepDatabase();
  }

  private prepDatabase = () => {
    this.db.run(
      "CREATE TABLE IF NOT EXISTS map (char TEXT NOT NULL, x INTEGER NOT NULL, y INTEGER NOT NULL)",
    );

    this.db.run(
      "CREATE TABLE IF NOT EXISTS users (fingerprint TEXT PRIMARY KEY, lastActionDate TEXT)",
    );

    this.db.run(
      "CREATE TABLE IF NOT EXISTS users (fingerprint TEXT PRIMARY KEY, lastActionDate TEXT)",
    );
  };

  public runAsync = async (query: string, params: Array<string | number> = []) => {
    return new Promise<void>((res, rej) => {
      this.db.run(query, ...params, (err: any) => {
        if (err) rej(err);
        else res();
      });
    });
  };
}
