const HasUserPlaced = (DB, fingerprint, callback) => {
  DB.serialize(() => {
    DB.get(
      "SELECT lastActionDate FROM users WHERE fingerprint=?",
      fingerprint,
      (err, result) => {
        if (result == undefined) callback(false);
        else callback(true);
      }
    );
  });
};

const InsertUserPlaced = (DB, fingerprint, callback) => {
  DB.serialize(() => {
    DB.get(
      "SELECT lastActionDate FROM users WHERE fingerprint=?",
      fingerprint,
      (err, result) => {
        if (result == undefined) {
          DB.run(
            "INSERT into users (fingerprint,lastActionDate) VALUES(?, DATE())",
            fingerprint
          );
        } else {
          DB.run(
            "UPDATE users SET lastActionDate = DATE() WHERE fingerprint = ?",
            fingerprint
          );
        }
        callback();
      }
    );
  });
};

module.exports = {
  InsertUserPlaced,
  HasUserPlaced,
};
