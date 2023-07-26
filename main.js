const tls = require("tls");
const fs = require("fs");
const map = require("./map");
const { InitDB, DB } = require("./db");
const { HasUserPlaced, InsertUserPlaced } = require("./user");

const PORT = 1965;
const HOST = "localhost";
const TEMPLATE = fs.readFileSync("./template.gmi");

const options = {
  key: fs.readFileSync("private-key.pem"),
  cert: fs.readFileSync("public-cert.pem"),
  requestCert: true,
  isServer: true,
  rejectUnauthorized: false,
};

InitDB(() => {
  map.InitMap(DB);

  schedule.scheduleJob("1 0 * * 1", function () {
    console.info("MAP RESET");
    map.InitMap(DB);
  });
});

const server = tls.createServer(options, (socket) => {
  socket.on("data", (stream) => {
    const request = stream.toString().trim();

    if (request.startsWith(`gemini://${HOST}/place`)) {
      if (!socket.getPeerCertificate().fingerprint) {
        socket.write("60 text/gemini; charset=utf-8\r\n");
        socket.end();
      }

      if (request.includes("?")) {
        const params = decodeURIComponent(request.split("?")[1]).split(" ");

        if (params.length != 2) {
          socket.write(`30 gemini://${HOST}/error.gmi\r\n`);
          socket.end();
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
            socket.write(`30 gemini://${HOST}/already_placed.gmi\r\n`);
            socket.end();
            return;
          } else {
            map.PlaceChar(
              Number.parseInt(coordinates[0]),
              Number.parseInt(coordinates[1]),
              char,
              DB,
              (result) => {
                if (result) {
                  InsertUserPlaced(
                    DB,
                    socket.getPeerCertificate().fingerprint,
                    () => {
                      socket.write(`30 gemini://${HOST}/play\r\n`);
                      socket.end();
                      return;
                    }
                  );
                } else {
                  socket.write(`30 gemini://${HOST}/error.gmi\r\n`);
                  socket.end();
                  return;
                }
              }
            );
          }
        });
      } else {
        socket.write(
          "10 Enter an ASCII character to place, followed by coordinates. Example: '+ 0,5' places a + 0 from the left and 5 from the top.\r\n"
        );
        socket.end();
      }
    } else if (request.startsWith(`gemini://${HOST}/error`)) {
      const file = fs.readFileSync("./error.gmi");
      socket.write("20 text/gemini; charset=utf-8\r\n" + file);
      socket.end();
    } else if (request.startsWith(`gemini://${HOST}/already_placed`)) {
      const file = fs.readFileSync("./already_placed.gmi");
      socket.write("20 text/gemini; charset=utf-8\r\n" + file);
      socket.end();
    } else if (request.startsWith(`gemini://${HOST}/play`)) {
      if (!socket.getPeerCertificate().fingerprint) {
        socket.write("60 text/gemini; charset=utf-8\r\n");
        socket.end();
      }

      map.GetMapString(DB, (map) => {
        const mapTemplate = TEMPLATE.toString().replace("{MAP}", map);
        socket.write("20 text/gemini; charset=utf-8\r\n" + mapTemplate);
        socket.end();
      });
    } else {
      const file = fs.readFileSync("./index.gmi");
      socket.write("20 text/gemini; charset=utf-8\r\n" + file);
      socket.end();
    }
  });
});

server.listen(PORT, HOST, () => {
  console.info("Server started");
});

server.on("tlsClientError", (error) => {
  console.error(error);
  server.close();
});
