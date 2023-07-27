const GetEntries = (DB, callback) => {
  DB.serialize(() => {
    DB.all(
      "SELECT * from guestbook ORDER BY log_id DESC LIMIT 100",
      (err, result) => {
        console.info("GetEntries: Retrieved guestbook entries.");
        callback(result ?? []);
      }
    );
  });
};

const InsertLog = (DB, username, message, callback) => {
  DB.serialize(() => {
    DB.run(
      "INSERT INTO guestbook (message, username) VALUES(?, ?)",
      message,
      username,
      callback
    );
  });
};

module.exports = {
  GetEntries,
  InsertLog,
};
