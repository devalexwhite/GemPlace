const MAP_SIZE = 20;
const BLANK_CHAR = "-";

const FirstRunCheck = (DB) => {
  DB.get("SELECT count(*) as count from map", (err, result) => {
    console.info(`FirstRunCheck: DB size is ${result.count}.`);
    if (result.count == 0) InitMap(DB);
  });
};

const InitMap = (DB) => {
  DB.run("DELETE FROM map", () => {
    console.info("InitMap: DB cleared.");
    for (y in [...new Array(MAP_SIZE)]) {
      for (x in [...new Array(MAP_SIZE)]) {
        const stmt = DB.prepare(
          `INSERT INTO map (char,x,y) VALUES ('${BLANK_CHAR}', ${x}, ${y})`
        );
        stmt.run();
        stmt.finalize();
      }
    }
    console.info("Map initialized.");
  });
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
      mapString += "[38;5;45m" + map[y][x] + "   ";
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
    char.charCodeAt(0) < 32 ||
    char.charCodeAt(0) > 126
  ) {
    callback(false);
    return;
  }

  DB.run("UPDATE map SET char=? WHERE x=? AND y=?", char, x, y, () => {
    console.info("Character placed.");
    callback(true);
  });
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
      console.info("Map retrieved.");
      callback(mapString(map));
    }
  );
};

module.exports = {
  InitMap,
  GetMapString,
  PlaceChar,
  FirstRunCheck,
};
