import { Database } from "../lib/Database";

export interface DBObject {
  id: number | null;
  save: (db: Database) => Promise<number>;
  delete: (db: Database) => Promise<void>;
}
