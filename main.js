const tls = require("tls");
const fs = require("fs");
const map = require("./map");
const { InitDB, DB } = require("./db");
const { HasUserPlaced, InsertUserPlaced } = require("./user");
const schedule = require("node-schedule");
const { GetEntries, InsertLog } = require("./guestlog");

const PORT = 1965;
const HOST = "localhost";

const options = {
  key: fs.readFileSync("private-key.pem"),
  cert: fs.readFileSync("public-cert.pem"),
  requestCert: true,
  isServer: true,
  rejectUnauthorized: false,
};

InitDB(() => {
  map.FirstRunCheck(DB);

  schedule.scheduleJob("1 0 * * 1", function () {
    console.info("MAP RESET");
    map.InitMap(DB);
  });
});

const server = tls.createServer(options, (socket) => {
  socket.on("data", (stream) => {
    console.info("Client connected");

    const request = stream.toString().trim();

    if (request.startsWith(`gemini://${HOST}/place`)) {
      if (!socket.getPeerCertificate().fingerprint) {
        try {
          socket.write("60 text/gemini; charset=utf-8\r\n");
          socket.end();
        } catch {
          console.error("Socket already closed");
        }
        return;
      }

      if (request.includes("?")) {
        const params = decodeURIComponent(request.split("?")[1]).split(" ");

        if (params.length != 2) {
          try {
            socket.write(`30 gemini://${HOST}/error.gmi\r\n`);
            socket.end();
          } catch {
            console.error("Socket already closed");
          }
          return;
        }

        const char = params[0];
        const coordinates = params[1].split(",");

        if (coordinates.length != 2) {
          socket.write(`30 gemini://${HOST}/error.gmi\r\n`);
          socket.end();
          return;
        }

        HasUserPlaced(DB, socket.getPeerCertificate().fingerprint, (result) => {
          if (result) {
            try {
              socket.write(`30 gemini://${HOST}/already_placed.gmi\r\n`);
              socket.end();
            } catch {
              console.error("Socket already closed");
            }
            return;
          } else {
            const x = Number.parseInt(coordinates[0]);
            const y = Number.parseInt(coordinates[1]);
            map.PlaceChar(x, y, char, DB, (result) => {
              if (result) {
                InsertUserPlaced(
                  DB,
                  socket.getPeerCertificate().fingerprint,
                  () => {
                    InsertLog(
                      DB,
                      socket.getPeerCertificate().subject.CN,
                      `Placed "${char}" at ${x},${y}`,
                      () => {
                        try {
                          socket.write(`30 gemini://${HOST}/play\r\n`);
                          socket.end();
                        } catch {
                          console.error("Socket already closed");
                        }
                        return;
                      }
                    );
                  }
                );
              } else {
                try {
                  socket.write(`30 gemini://${HOST}/error.gmi\r\n`);
                  socket.end();
                } catch {
                  console.error("Socket already closed");
                }
                return;
              }
            });
          }
        });
      } else {
        try {
          socket.write(
            "10 Enter an ASCII character to place, followed by coordinates. Example: '+ 0,5' places a + 0 from the left and 5 from the top.\r\n"
          );
          socket.end();
        } catch {
          console.error("Socket already closed");
        }
        return;
      }
    } else if (request.startsWith(`gemini://${HOST}/error`)) {
      const file = fs.readFileSync("./error.gmi");
      try {
        socket.write("20 text/gemini; charset=utf-8\r\n" + file);
        socket.end();
      } catch {
        console.error("Socket already closed");
      }
    } else if (request.startsWith(`gemini://${HOST}/already_placed`)) {
      const file = fs.readFileSync("./already_placed.gmi");
      try {
        socket.write("20 text/gemini; charset=utf-8\r\n" + file);
        socket.end();
      } catch {
        console.error("Socket already closed");
      }
    } else if (request.startsWith(`gemini://${HOST}/changelog`)) {
      const file = fs.readFileSync("./changelog.gmi");
      try {
        socket.write("20 text/gemini; charset=utf-8\r\n" + file);
        socket.end();
      } catch {
        console.error("Socket already closed");
      }
    } else if (request.startsWith(`gemini://${HOST}/play`)) {
      if (!socket.getPeerCertificate().fingerprint) {
        try {
          socket.write("60 text/gemini; charset=utf-8\r\n");
          socket.end();
        } catch {
          console.error("Socket already closed");
        }
        return;
      }

      map.GetMapString(DB, (map) => {
        const file = fs.readFileSync("./play.gmi");
        const mapTemplate = file.toString().replace("{MAP}", map);
        try {
          socket.write("20 text/gemini; charset=utf-8\r\n" + mapTemplate);
          socket.end();
          return;
        } catch {
          console.error("Socket already closed");
        }
      });
    } else if (request.startsWith(`gemini://${HOST}/guestlog/post`)) {
      if (request.includes("?")) {
        const message = decodeURIComponent(request.split("?")[1]);

        InsertLog(DB, socket.getPeerCertificate().subject.CN, message, () => {
          try {
            socket.write(`30 gemini://${HOST}/guestlog.gmi\r\n`);
            socket.end();
          } catch {
            console.error("Socket already closed");
          }
          return;
        });
      } else {
        try {
          socket.write("10 Enter your message\r\n");
          socket.end();
        } catch {
          console.error("Socket already closed");
        }
        return;
      }
    } else if (request.startsWith(`gemini://${HOST}/guestlog`)) {
      let file = fs.readFileSync("./guestlog.gmi");
      GetEntries(DB, (entries) => {
        let entriesString = entries
          .map(
            (entry) =>
              `> ${entry.message}\n> - ${entry.username}, ${entry.date}`
          )
          .join("\n\n");
        file = file.toString().replace("{LOG}", entriesString);
        socket.write("20 text/gemini; charset=utf-8\r\n" + file);
        socket.end();
        return;
      });
    } else {
      const file = fs.readFileSync("./index.gmi");
      try {
        socket.write("20 text/gemini; charset=utf-8\r\n" + file);
        socket.end();
        return;
      } catch {
        console.error("Socket already closed");
      }
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.info("Server started");
});

server.on("tlsClientError", (error) => {
  console.error(error);
  server.close();
});
