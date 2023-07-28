import tls from "tls";
import { Gemmine } from "./Gemmine";

export class GemmineRequest {
  private url: URL;
  private server: Gemmine;
  public hostname: string;
  public path: string;
  public input: string;
  public hasCertificate: boolean;
  public certFingerprint?: string;
  public certName?: string;

  constructor(server: Gemmine, socket: tls.TLSSocket, stream: any) {
    this.server = server;
    const url = new URL(stream);

    this.hostname = url.hostname;
    this.url = url;
    this.path = url.pathname;
    this.input = url.search.replace("?", "");
    this.hasCertificate = socket.getPeerCertificate() != null;
    if (this.hasCertificate) {
      this.certName = socket.getPeerCertificate(true)?.subject?.CN || undefined;
      this.certFingerprint =
        socket.getPeerCertificate(true)?.fingerprint || undefined;
    }
  }
}
