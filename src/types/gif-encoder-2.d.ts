declare module 'gif-encoder-2' {
  interface EncoderOutput {
    getData(): Uint8Array;
  }

  class GIFEncoder {
    out: EncoderOutput;

    constructor(width: number, height: number);

    start(): void;
    finish(): void;
    setRepeat(repeat: number): void;
    setDelay(delay: number): void;
    setQuality(quality: number): void;
    addFrame(ctx: CanvasRenderingContext2D): void;
  }

  export = GIFEncoder;
}
