export interface GemmineViewSwap {
  key: string;
  value: string;
}

export class GemmineView {
  private file: File;
  private filePath: string;
  private swaps: Array<GemmineViewSwap>;

  constructor(filePath: string, dataSwaps: Array<GemmineViewSwap>) {
    this.filePath = filePath;
    this.swaps = dataSwaps;
  }

  private loadFile = async () => {};

  private performSwaps = () => {};

  public toString = async () => {};
}
