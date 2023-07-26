const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(":memory:");

const MAP_SIZE = 20;
const BLANK_CHAR = "-";

const InitMap = (DB) => {
  for (y in [...new Array(MAP_SIZE)]) {
    for (x in [...new Array(MAP_SIZE)]) {
      const stmt = DB.prepare(
        `INSERT INTO map (char,x,y) VALUES ('${BLANK_CHAR}', ${x}, ${y})`
      );
      stmt.run();
      stmt.finalize();
    }
  }
};

const mapString = (map) => {
  let mapString = "\t";
  for (x in [...new Array(MAP_SIZE)])
    mapString += `${x}${[...new Array(4 - x.length)].map(() => " ").join("")}`;
  mapString += "\n";
  for (y in map) {
    if (!map[y]) continue;
    mapString += `\n\n${y}\t`;
    for (x in map[y]) {
      mapString += map[y][x] + "   ";
    }
  }

  return mapString;
};

const PlaceChar = (x, y, char, DB, callback) => {
  if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) {
    callback(false);
    return;
  }

  if (
    char.length !== 1 ||
    char.charCodeAt(0) < 33 ||
    char.charCodeAt(0) > 125
  ) {
    callback(false);
    return;
  }

  const stmt = DB.prepare(
    `INSERT INTO map (char,x,y) VALUES ('${char}', ${x}, ${y})`
  );
  stmt.run();
  stmt.finalize();
  callback(true);
};

const GetMapString = (DB, callback) => {
  let map = [];

  DB.each(
    "SELECT char, x, y FROM map",
    (err, row) => {
      if (!map[row.y]) map[row.y] = [];
      map[row.y][row.x] = row.char;
    },
    () => {
      callback(mapString(map));
    }
  );
};

module.exports = {
  InitMap,
  GetMapString,
  PlaceChar,
};
