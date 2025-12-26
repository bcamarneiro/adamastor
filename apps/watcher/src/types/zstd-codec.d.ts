declare module 'zstd-codec' {
  export namespace ZstdCodec {
    export function run(callback: (instance: any) => void): void;
  }

  export namespace Simple {
    export class Compressor {
      constructor();
      compressUInt8Array(input: Uint8Array, compressionLevel?: number): Uint8Array;
    }

    export class Decompressor {
      constructor();
      decompressUInt8Array(input: Uint8Array): Uint8Array;
    }
  }
}
