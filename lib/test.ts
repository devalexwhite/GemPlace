import { Gemmine } from "./Gemmine";

const server = new Gemmine({
  certPath: "../public-cert.pem",
  keyPath: "../private-key.pem",
  hostname: "localhost",
});

server.get("/", (response, _) => {
  response.write("# Hey there bud\n=> /test Go test");
});

server.get("/test", (response, _) => {
  response.write(
    "# Welllp you found me\n=> / Go back\n=> /retrozilla.png See image!"
  );
});

server.get("/output.png", (response, _) => {
  response.file("output.png");
});

server.get("/retrozilla.png", (response, _) => {
  response.file("retrozilla.png");
});

server.listen(() => {});
