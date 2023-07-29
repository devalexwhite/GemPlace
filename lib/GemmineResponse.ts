import tls, { TLSSocket } from "tls";
import { Gemmine, GemmineVerbosity } from "./Gemmine";
import * as mime from "mime";
import fs from "fs/promises";
import * as Path from "path";

export enum ResponseType {
  INPUT = 10,
  OKAY = 20,
  REDIRECT = 30,
  UNAUTHORIZED = 60,
}

export class GemmineResponse {
  socket: TLSSocket;
  server: Gemmine;

  constructor(server: Gemmine, socket: TLSSocket) {
    this.socket = socket;
    this.server = server;
  }

  private writeToSocket = (
    message: string | Buffer,
    close: boolean = true,
    encoding?: BufferEncoding | null
  ) => {
    try {
      if (this.socket.writable) {
        if (encoding) {
          this.socket.write(message, encoding);
        } else {
          this.socket.write(message);
        }
        this.server.writeLog(
          "GemmineResponse:writeToSocket",
          "sent response",
          GemmineVerbosity.INFO
        );
      } else {
        throw new Error("Failed to write, socket already closed.");
      }
    } catch (e: any) {
      this.server.writeLog(
        "GemmineResponse:write",
        e.message,
        GemmineVerbosity.ERROR
      );
    } finally {
      if (close && !this.socket.closed) {
        this.socket.end();
        this.server.writeLog(
          "GemmineResponse:writeToSocket",
          "ended socket",
          GemmineVerbosity.INFO
        );
      }
    }
  };

  public redirect = (targetURL: string) => {
    const responseString = `${ResponseType.REDIRECT} ${targetURL}\r\n`;

    this.writeToSocket(responseString, true);
  };

  public unauthorized = (message?: string) => {
    const responseString = `${ResponseType.UNAUTHORIZED} ${message ?? ""}\r\n`;

    this.writeToSocket(responseString, true);
  };

  public write = (message: string) => {
    const responseString = `${ResponseType.OKAY} text/gemini; charset=utf-8\r\n${message}`;

    this.writeToSocket(responseString, true);
  };

  public input = (message?: string) => {
    const responseString = `${ResponseType.INPUT} ${message ?? ""}\r\n`;

    this.writeToSocket(responseString, true);
  };

  public file = async (path: string) => {
    try {
      const file = await fs.readFile(path);

      const mimeType = mime.getType(Path.parse(path).ext);
      if (mimeType == null) {
        throw new Error("unsupported file type");
      } else {
        this.writeToSocket(`${ResponseType.OKAY} ${mimeType}\r\n`, false);
        this.writeToSocket(file, false, "utf-8");
        this.socket.end();
      }
    } catch (e: any) {
      this.server.writeLog(
        "GemmineResponse:file",
        e.message,
        GemmineVerbosity.ERROR
      );
      this.socket.end();
    }
  };
}
