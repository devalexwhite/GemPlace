import { Gemmine } from "./Gemmine";

const server = new Gemmine({
  certPath: "../public-cert.pem",
  keyPath: "../private-key.pem",
});

server.get("/", (response, request) => {
  response.write("# Hey there bud\n=> /test Go test");
});

server.get("/test", (response, request) => {
  response.write("# Welllp you found me\n=> / Go back");
});

server.listen(() => {});
