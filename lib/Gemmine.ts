import fs from "fs/promises";
import { GemmineResponse } from "./GemmineResponse";
import tls from "tls";
import { GemmineRequest } from "./GemmineRequest";

export enum GemmineVerbosity {
  SILENT,
  ERROR,
  INFO,
}

interface RouteHandler {
  route: string;
  handler: (response: GemmineResponse, request: GemmineRequest) => void;
}

export interface GemmineConfig {
  verbosity?: GemmineVerbosity;
  keyPath: string;
  certPath: string;
  hostname?: string;
  port?: number;
}

export class Gemmine {
  private verbosity: GemmineVerbosity;
  private keyPath: string;
  private certPath: string;
  private routes: Array<RouteHandler> = [];
  private hostname: string;
  private port: number;
  private tlsServer: tls.Server | null = null;

  constructor({
    verbosity = GemmineVerbosity.INFO,
    keyPath,
    certPath,
    hostname = "localhost",
    port = 1965,
  }: GemmineConfig) {
    this.verbosity = verbosity;
    this.keyPath = keyPath;
    this.certPath = certPath;
    this.hostname = hostname;
    this.port = port;
  }

  private findRouteHandler(request: GemmineRequest): RouteHandler | null {
    const requestNormal = request.path.replace(".gmi", "").trim().toLowerCase();

    for (const handler of this.routes) {
      const handlerNormal = handler.route
        .replace(".gmi", "")
        .trim()
        .toLowerCase();

      if (handlerNormal == requestNormal) return handler;
    }
    return null;
  }

  public writeLog(
    callingFunction: string,
    message: string,
    messageType: GemmineVerbosity
  ) {
    // TODO: Support for a log file
    if (
      messageType == GemmineVerbosity.ERROR &&
      [GemmineVerbosity.ERROR, GemmineVerbosity.INFO].includes(this.verbosity)
    ) {
      console.error(
        `${new Date().toISOString()} ${callingFunction} - ${message}`
      );
    } else if (
      messageType == GemmineVerbosity.INFO &&
      this.verbosity == GemmineVerbosity.INFO
    ) {
      console.info(
        `${new Date().toISOString()} ${callingFunction} - ${message}`
      );
    }
  }

  public get = (
    route: string,
    callback: (response: GemmineResponse, request: GemmineRequest) => void
  ) => {
    this.routes.push({ route, handler: callback } as RouteHandler);
  };

  public listen = async (callback: () => void) => {
    try {
      const keyFile = await fs.readFile(this.keyPath);
      const certFile = await fs.readFile(this.certPath);

      this.writeLog(
        "Gemmine:listen",
        "cert & key loaded",
        GemmineVerbosity.INFO
      );

      const serverConfig = {
        key: keyFile.toString(),
        cert: certFile.toString(),
        requestCert: true,
        isServer: true,
        rejectUnauthorized: false,
      } as tls.TlsOptions;

      this.tlsServer = tls.createServer(serverConfig, (socket) => {
        socket.on("data", (stream) => {
          this.writeLog(
            "Gemmine:listen",
            "socket opened",
            GemmineVerbosity.INFO
          );
          const request = new GemmineRequest(socket, stream);
          const response = new GemmineResponse(this, socket);

          const handler = this.findRouteHandler(request);
          if (handler !== null) {
            handler.handler(response, request);
            this.writeLog(
              "Gemmine:listen",
              `handled by ${handler.route}`,
              GemmineVerbosity.INFO
            );
          } else {
            response.notFound();
            this.writeLog(
              "Gemmine:listen",
              "no matching handler",
              GemmineVerbosity.INFO
            );
          }
        });
      });

      try {
        this.tlsServer.on("tlsClientError", (err) => {
          this.writeLog("Gemmine:listen", err.message, GemmineVerbosity.ERROR);
        });
        this.tlsServer.listen(this.port, this.hostname, () => {
          this.writeLog(
            "Gemmine:listen",
            `server started ${this.hostname}:${this.port}`,
            GemmineVerbosity.INFO
          );

          callback();
        });
      } catch (e: any) {
        this.writeLog("Gemmine:listen", e.message, GemmineVerbosity.ERROR);
      }
    } catch (e: any) {
      this.writeLog("Gemmine:listen", e.message, GemmineVerbosity.ERROR);
    }
  };
}
