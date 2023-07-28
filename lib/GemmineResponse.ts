import tls, { TLSSocket } from "tls";
import { Gemmine, GemmineVerbosity } from "./Gemmine";
import fs from "fs/promises";

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

  private writeToSocket = (message: string, close: boolean = true) => {
    try {
      if (this.socket.writable) {
        this.socket.write(message);
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
      const file = fs.readFile(path);
    } catch (e) {
      this.server.writeLog(
        "GemmineResponse:file",
        e.message,
        GemmineVerbosity.ERROR
      );
    } finally {
      this.socket.end();
    }
  };
}
