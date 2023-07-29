import tls from "tls";
import { Gemmine } from "./Gemmine";

export class GemmineRequest {
  public hostname: string;
  public path: string;
  public input?: string;
  public hasCertificate: boolean;
  public certFingerprint?: string;
  public certName?: string;
  public hasInput: boolean;

  constructor(socket: tls.TLSSocket, stream: any) {
    const url = new URL(stream);

    this.hostname = url.hostname;
    this.path = url.pathname;
    this.hasInput = url.search.toString().includes("?");
    this.input = this.hasInput ? url.search.replace("?", "") : undefined;

    this.hasCertificate = socket.getPeerCertificate()?.fingerprint != undefined;
    if (this.hasCertificate) {
      this.certName = socket.getPeerCertificate(true)?.subject?.CN || undefined;
      this.certFingerprint = socket.getPeerCertificate(true).fingerprint;
    }
  }
}
