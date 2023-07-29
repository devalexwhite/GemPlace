import { Gemmine, GemmineVerbosity } from "./lib/Gemmine";

const server = new Gemmine({
  verbosity: GemmineVerbosity.INFO,
  keyPath: "private-key.pem",
  certPath: "public-cert.pem",
  hostname: "localhost",
});

server.get("/", (response, _) => {
  response.file("views/index.gmi");
});

server.get("/play", (response, request) => {
  if (!request.hasCertificate) {
    response.unauthorized();
    return;
  }

  if (request.hasInput) {
  }

  response.file("views/play.gmi");
});

server.get("/changelog", (response, _) => {
  response.file("views/changelog.gmi");
});

server.listen(() => {});
