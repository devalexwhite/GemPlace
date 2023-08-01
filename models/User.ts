import { Database } from "../lib/Database";
import { DBObject } from "./DBObject";

interface UserInterface {
  name: string;
  lastPlaceDate: string;
  fingerprint: string;
  id: number | null;
}

export class User implements DBObject {
  public id: number | null;
  public fingerprint: string;
  public name: string;
  public lastPlaceDate: string;

  constructor({ name, lastPlaceDate, fingerprint, id = null }: UserInterface) {
    this.name = name;
    this.lastPlaceDate = lastPlaceDate;
    this.fingerprint = fingerprint;

    if (id != null) this.id = id;
  }

  public delete = async (db: Database) => {
    await db.runAsync("DELETE FROM users WHERE id=?", this.id);
  };

  public save = async (db: Database) => {
    if (this.id == null) {
      await db.runAsync(
        "INSERT INTO users (fingerprint, name, lastPlaceDate) VALUES (?, ?, ?)",
        this.fingerprint,
        this.name,
        this.lastPlaceDate,
      );
    }

    return this.id!;
  };
}
